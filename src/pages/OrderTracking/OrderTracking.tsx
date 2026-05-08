import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, ChevronRight, ArrowLeft, QrCode, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Order, StoreSettings } from '../../types/index';
import { trackOrder, getMyOrders, getSettings, generateOrderPixPayment } from '../../services/api';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatters';
import Toast from '../../components/atoms/Toast/Toast';
import MainLayout from '../../components/templates/MainLayout/MainLayout';
import CartDrawer from '../../components/organisms/CartDrawer/CartDrawer';
import PixPaymentModal from '../../components/organisms/PixPaymentModal/PixPaymentModal';

import styles from './OrderTracking.module.css';

interface TimelineStep {
  label: string;
  statusThreshold: number;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { label: 'Cancelado', statusThreshold: 0 },
  { label: 'Pedido Realizado', statusThreshold: 1 },
  { label: 'Aguardando recibo PIX', statusThreshold: 2 },
  { label: 'Pagamento Confirmado', statusThreshold: 3 },
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
  2: 'Aguardando recibo PIX',
  3: 'Em separação',
  4: 'Aguardando coleta',
  5: 'Finalizado',
};

interface PixModalState {
  orderId: number;
  amount: number;
  qrCode: string;
  paymentString: string;
  externalId: string;
  expirationDate: string;
}

function normalizePixPayment(raw: unknown): PixModalState | null {
  if (!raw || typeof raw !== 'object') return null;
  const payment = raw as Record<string, unknown>;

  const qrCode = typeof payment.qrCode === 'string' ? payment.qrCode : typeof payment.qr_code === 'string' ? payment.qr_code : '';
  const paymentString = typeof payment.paymentString === 'string'
    ? payment.paymentString
    : typeof payment.payment_string === 'string'
      ? payment.payment_string
      : '';

  if (!qrCode || !paymentString) return null;

  const amountRaw = payment.amount;
  const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw ?? 0);

  return {
    orderId: Number(payment.order_id ?? 0),
    amount: Number.isFinite(amount) ? amount : 0,
    qrCode,
    paymentString,
    externalId: String(payment.externalId ?? payment.external_id ?? ''),
    expirationDate: String(payment.expirationDate ?? payment.expires_at ?? new Date().toISOString()),
  };
}

function isAwaitingPayment(status: number): boolean {
  return status === 1 || status === 2;
}

function isDeliveryVerificationEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  const normalized = String(value ?? '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  return true;
}

const OrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const { customer, isLoggedIn } = useCustomerAuth();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [deliveryVerificationEnabled, setDeliveryVerificationEnabled] = useState(true);
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
  const [pixLoadingOrderId, setPixLoadingOrderId] = useState<number | null>(null);
  const [pixModalData, setPixModalData] = useState<PixModalState | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const loadMyOrders = async (): Promise<Order[]> => {
    if (!customer?.phone) return [];
    const response = await getMyOrders(customer.phone);
    const orders = response.data || [];
    setMyOrders(orders);
    return orders;
  };

  const reloadSelectedOrder = async (currentOrderId?: number) => {
    const activeOrderId = currentOrderId ?? selectedOrderFull?.id ?? selectedOrder?.id;
    if (!activeOrderId) return;

    const activePhone = customer?.phone ?? phone.trim();
    if (!activePhone) return;

    const response = await trackOrder(activeOrderId, activePhone);
    setSelectedOrderFull(response.data);
  };

  useEffect(() => {
    getSettings()
      .then((r) => {
        setSettings(r.data);
        setDeliveryVerificationEnabled(isDeliveryVerificationEnabled(r.data?.enable_delivery_verification));
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (isLoggedIn && customer?.phone) {
      setMyOrdersLoading(true);
      loadMyOrders()
        .then(() => undefined)
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

  const handlePixPayment = async (order: Order) => {
    setPixLoadingOrderId(order.id);
    try {
      const res = await generateOrderPixPayment(order.id);
      const parsed = normalizePixPayment(res.data.payment);
      if (!parsed) {
        addToast('error', 'Não foi possível montar o QR Code PIX para este pedido.', 7000);
        return;
      }
      setPixModalData({ ...parsed, orderId: order.id, amount: parsed.amount || order.total_price });
    } catch (error) {
      console.error('[OrderTracking] Falha ao gerar PIX', error);
      addToast('error', 'Não foi possível gerar a cobrança PIX agora. Tente novamente em instantes.', 7000);
    } finally {
      setPixLoadingOrderId(null);
    }
  };

  const openWhatsAppForOrder = (order: Order) => {
    const storePhone = (settings?.whatsapp ?? '').replace(/\D/g, '');
    if (!storePhone) return;
    const message = [
      'Olá! Acabei de realizar o pagamento via PIX e vou enviar o comprovante do meu pedido.',
      '',
      `*Pedido #${order.id}*`,
      `*Valor total:* ${formatCurrency(order.total_price)}`,
      `*Data do pedido:* ${new Intl.DateTimeFormat('pt-BR').format(new Date(order.created_at))}`,
      '',
      `Meu nome: ${customer?.name ?? 'Cliente'}`,
      `Meu telefone: ${customer?.phone ?? 'Não informado'}`,
    ].join('\n');

    window.open(`https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`, '_blank');
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

          {deliveryVerificationEnabled && (order as Order & { verification_word?: string }).verification_word && (
            <div className={styles.verificationBox}>
              <p className={styles.verificationBoxLabel}>Palavra de verificação na entrega</p>
              <p className={styles.verificationBoxWord}>
                {(order as Order & { verification_word?: string }).verification_word}
              </p>
              <p className={styles.verificationBoxHint}>Apresente esta palavra ao vendedor no momento da entrega.</p>
            </div>
          )}

          {isAwaitingPayment(order.status) && (
            <div className={styles.paymentActions}>
              <button
                type="button"
                className={styles.pixPayBtn}
                onClick={() => handlePixPayment(order)}
                disabled={pixLoadingOrderId === order.id}
              >
                {pixLoadingOrderId === order.id ? <Loader2 size={14} className={styles.spinner} /> : <QrCode size={14} />}
                {pixLoadingOrderId === order.id ? 'Gerando PIX...' : order.status === 2 ? 'Ver PIX novamente' : 'Pagar via PIX'}
              </button>
              {settings?.whatsapp && order.status === 2 && (
                <button
                  type="button"
                  className={styles.whatsappPayBtn}
                  onClick={() => openWhatsAppForOrder(order)}
                >
                  <MessageCircle size={14} />
                  Enviar comprovante pelo WhatsApp
                </button>
              )}
            </div>
          )}
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

      {pixModalData && (
        <PixPaymentModal
          isOpen={Boolean(pixModalData)}
          orderId={pixModalData.orderId}
          amount={pixModalData.amount}
          qrCode={pixModalData.qrCode}
          paymentString={pixModalData.paymentString}
          externalId={pixModalData.externalId}
          expirationDate={pixModalData.expirationDate}
          onClose={() => setPixModalData(null)}
          onCancel={() => {
            setPixModalData(null);
          }}
          onExpired={() => {
            const expiredOrderId = pixModalData.orderId;
            setPixModalData(null);

            if (isLoggedIn && customer?.phone) {
              void loadMyOrders()
                .then((orders) => {
                  const updatedOrder = orders.find((order) => order.id === expiredOrderId) || null;
                  setSelectedOrder(updatedOrder);
                  return reloadSelectedOrder(expiredOrderId);
                })
                .catch(() => null);
            } else if (orderId.trim() && phone.trim()) {
              void reloadSelectedOrder(expiredOrderId).catch(() => null);
            }

            addToast('error', 'O QR Code PIX expirou. Gere um novo PIX para concluir o pagamento.', 7000);
          }}
          cancelLabel="Fechar por agora"
          closeLabel="Continuar vendo o PIX"
        />
      )}
      <Toast toasts={toasts} onClose={removeToast} />
    </MainLayout>
  );
};

export default OrderTracking;
