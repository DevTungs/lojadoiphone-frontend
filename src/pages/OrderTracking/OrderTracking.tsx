import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Order, StoreSettings } from '../../types/index';
import { trackOrder, getMyOrders, getSettings } from '../../services/api';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { formatCurrency } from '../../utils/formatters';
import MainLayout from '../../components/templates/MainLayout/MainLayout';
import CartDrawer from '../../components/organisms/CartDrawer/CartDrawer';

import styles from './OrderTracking.module.css';

interface TimelineStep {
  label: string;
  statusThreshold: number;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { label: 'Pedido realizado', statusThreshold: 0 },
  { label: 'Aguardando pagamento', statusThreshold: 1 },
  { label: 'Pagamento confirmado', statusThreshold: 2 },
  { label: 'Pedido em separação', statusThreshold: 3 },
  { label: 'Aguardando coleta', statusThreshold: 4 },
  { label: 'Pedido finalizado', statusThreshold: 5 },
];

type StepState = 'done' | 'active' | 'pending';

function getStepState(stepIndex: number, orderStatus: number): StepState {
  if (orderStatus > stepIndex) return 'done';
  if (orderStatus === stepIndex) return 'active';
  return 'pending';
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Cancelado',
  1: 'Aguardando pagamento',
  2: 'Pagamento confirmado',
  3: 'Em separação',
  4: 'Aguardando coleta',
  5: 'Finalizado',
};

const OrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const { customer, isLoggedIn } = useCustomerAuth();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Manual form state
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Logged-in customer state
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderFull, setSelectedOrderFull] = useState<Order | null>(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  const [selectedOrderError, setSelectedOrderError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((r) => setSettings(r.data)).catch(() => null);
  }, []);

  useEffect(() => {
    if (isLoggedIn && customer?.phone) {
      setMyOrdersLoading(true);
      getMyOrders(customer.phone)
        .then((r) => setMyOrders(r.data))
        .catch(() => setMyOrders([]))
        .finally(() => setMyOrdersLoading(false));
    }
  }, [isLoggedIn, customer?.phone]);

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setSelectedOrderFull(null);
    setSelectedOrderError(null);
    setSelectedOrderLoading(true);
    try {
      const res = await trackOrder(order.id, customer!.phone);
      setSelectedOrderFull(res.data);
    } catch {
      setSelectedOrderError('Não foi possível carregar os detalhes do pedido.');
    } finally {
      setSelectedOrderLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    setSubmitted(false);
    try {
      const response = await trackOrder(orderId.trim(), phone.trim());
      setSubmitted(true);
      setSelectedOrderFull(response.data);
    } catch {
      setError('Pedido não encontrado. Verifique o número e o telefone informados.');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const renderTimeline = (order: Order) => (
    <>
      <div className={styles.timeline}>
        {TIMELINE_STEPS.map((step, index) => {
          const stepState = getStepState(index, order.status);
          const isLast = index === TIMELINE_STEPS.length - 1;
          return (
            <div key={step.label} className={styles.timelineItem}>
              {!isLast && (
                <div
                  className={[styles.line, stepState === 'done' ? styles.lineDone : ''].filter(Boolean).join(' ')}
                  aria-hidden="true"
                />
              )}
              <div
                className={[
                  styles.dot,
                  stepState === 'done' ? styles.dotDone : stepState === 'active' ? styles.dotActive : styles.dotPending,
                ].join(' ')}
                aria-hidden="true"
              >
                {stepState === 'done' ? <CheckCircle size={14} strokeWidth={2.5} /> : stepState === 'active' ? <Clock size={14} strokeWidth={2.5} /> : null}
              </div>
              <span
                className={[
                  styles.stepLabel,
                  stepState === 'done' ? styles.stepLabelDone : stepState === 'active' ? styles.stepLabelActive : styles.stepLabelPending,
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {order.items && order.items.length > 0 && (
        <div className={styles.orderInfo}>
          <p className={styles.orderInfoTitle}>Detalhes do pedido</p>
          <div className={styles.itemsList}>
            {order.items.map((item, index) => (
              <div key={index} className={styles.orderItem}>
                <span className={styles.orderItemName}>
                  {item.product_name ?? `Produto #${item.product_id}`}
                  {item.quantity > 1 && <span className={styles.orderItemQty}> x{item.quantity}</span>}
                </span>
                <span className={styles.orderItemPrice}>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className={styles.total}>
            <span>Total</span>
            <span>{formatCurrency(order.total_price)}</span>
          </div>
          <div className={styles.metaList}>
            {order.seller_name && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Vendedor</span>
                <span className={styles.metaValue}>{order.seller_name}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Data do pedido</span>
              <span className={styles.metaValue}>{formatDate(order.created_at)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Pedido nº</span>
              <span className={styles.metaValue}>#{order.id}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <MainLayout settings={settings} onCartClick={() => setIsCartOpen(true)}>
      <div className={styles.page}>
        <div className={styles.card}>
          {/* ─── Logged-in customer flow ─── */}
          {isLoggedIn && customer ? (
            <>
              {!selectedOrder ? (
                <>
                  <h1 className={styles.title}>Meus pedidos</h1>
                  <p className={styles.subtitle}>
                    Olá, {customer.name.split(' ')[0]}! Selecione um pedido para rastrear.
                  </p>

                  {myOrdersLoading ? (
                    <div className={styles.loadingState}>
                      <Loader2 size={32} className={styles.spinnerLarge} />
                      <p className={styles.loadingText}>Carregando seus pedidos...</p>
                    </div>
                  ) : myOrders.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyText}>Você ainda não fez nenhum pedido.</p>
                    </div>
                  ) : (
                    <div className={styles.orderList}>
                      {myOrders.map((order) => (
                        <button
                          key={order.id}
                          className={styles.orderListItem}
                          onClick={() => handleSelectOrder(order)}
                        >
                          <div className={styles.orderListLeft}>
                            <span className={styles.orderListId}>Pedido #{order.id}</span>
                            <span className={styles.orderListDate}>{formatDate(order.created_at)}</span>
                          </div>
                          <div className={styles.orderListRight}>
                            <span className={styles.orderListStatus}>{STATUS_LABELS[order.status] ?? `Status ${order.status}`}</span>
                            <span className={styles.orderListTotal}>{formatCurrency(order.total_price)}</span>
                          </div>
                          <ChevronRight size={16} className={styles.orderListChevron} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button className={styles.backBtn} onClick={() => { setSelectedOrder(null); setSelectedOrderFull(null); }}>
                    <ArrowLeft size={16} /> Voltar aos pedidos
                  </button>
                  <h1 className={styles.title}>Pedido #{selectedOrder.id}</h1>
                  <p className={styles.subtitle}>{formatDate(selectedOrder.created_at)}</p>

                  {selectedOrderLoading ? (
                    <div className={styles.loadingState}>
                      <Loader2 size={32} className={styles.spinnerLarge} />
                      <p className={styles.loadingText}>Buscando seu pedido...</p>
                    </div>
                  ) : selectedOrderError ? (
                    <div className={styles.errorCard}>
                      <AlertCircle size={20} className={styles.errorIcon} />
                      <p className={styles.errorText}>{selectedOrderError}</p>
                    </div>
                  ) : selectedOrderFull ? (
                    renderTimeline(selectedOrderFull)
                  ) : null}
                </>
              )}
            </>
          ) : (
            /* ─── Guest / manual form flow ─── */
            <>
              <h1 className={styles.title}>Rastreamento de pedido</h1>
              <p className={styles.subtitle}>
                Informe o número do pedido e o telefone utilizado na compra.
              </p>

              <form className={styles.form} onSubmit={handleManualSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="orderId">Número do pedido</label>
                  <input
                    id="orderId"
                    type="text"
                    className={styles.input}
                    placeholder="Ex: 1042"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="phone">Telefone</label>
                  <input
                    id="phone"
                    type="tel"
                    className={styles.input}
                    placeholder="Ex: +55 11 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    autoComplete="tel"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || !orderId.trim() || !phone.trim()}
                >
                  {loading ? (
                    <><Loader2 size={16} className={styles.spinner} />Buscando...</>
                  ) : (
                    'Rastrear pedido'
                  )}
                </button>
              </form>

              {loading && (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spinnerLarge} />
                  <p className={styles.loadingText}>Buscando seu pedido...</p>
                </div>
              )}

              {submitted && error && !loading && (
                <div className={styles.errorCard}>
                  <AlertCircle size={20} className={styles.errorIcon} />
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              {submitted && selectedOrderFull && !loading && renderTimeline(selectedOrderFull)}
            </>
          )}
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onFinalize={() => setIsCartOpen(false)} onLoginRequired={() => navigate('/login')} />
    </MainLayout>
  );
};

export default OrderTracking;
