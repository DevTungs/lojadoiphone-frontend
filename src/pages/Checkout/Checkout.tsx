import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, QrCode } from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { getSettings, getSellers, buildApiUrl } from '../../services/api';
import type { Seller, StoreSettings } from '../../types/index';
import { formatCurrency } from '../../utils/formatters';
import { assetUrl } from '../../utils/assetUrl';
import { useToast } from '../../hooks/useToast';

import MainLayout from '../../components/templates/MainLayout/MainLayout';
import Input from '../../components/atoms/Input/Input';
import PixPaymentModal from '../../components/organisms/PixPaymentModal/PixPaymentModal';
import Toast from '../../components/atoms/Toast/Toast';

import styles from './Checkout.module.css';

interface PixChargeData {
  orderId: number;
  qrCodeId: string;
  paymentString: string;
  qrCode: string;
  externalId: string;
  amount: number;
  expirationDate: string;
}

interface CheckoutFormData {
  deliveryFullName: string;
  pickupCity: string;
  pickupState: string;
  pickupPhone: string;
  deliveryReference: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, total, clearCart } = useCart();
  const { customer, isLoggedIn } = useCustomerAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(() => {
    const state = location.state as { preselectedSellerId?: string } | null;
    return state?.preselectedSellerId || '';
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixChargeData, setPixChargeData] = useState<PixChargeData | null>(null);

  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormData>({
    deliveryFullName: customer?.name ?? '',
    pickupCity: '',
    pickupState: '',
    pickupPhone: customer?.phone ?? '',
    deliveryReference: '',
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    Promise.all([getSettings(), getSellers()])
      .then(([settingsRes, sellersRes]) => {
        setSettings(settingsRes.data);
        setSellers(sellersRes.data || []);
      })
      .catch(() => {
        addToast('error', 'Não foi possível carregar dados do checkout.', 7000);
      });
  }, [addToast, isLoggedIn, navigate]);

  useEffect(() => {
    if (!customer) return;
    setCheckoutForm((prev) => ({
      ...prev,
      deliveryFullName: prev.deliveryFullName || customer.name || '',
      pickupPhone: prev.pickupPhone || customer.phone || '',
    }));
  }, [customer]);

  const itemCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  const updateCheckoutField = (field: keyof CheckoutFormData, value: string) => {
    setCheckoutForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!selectedSellerId) nextErrors.seller = 'Selecione um vendedor';
    if (!checkoutForm.deliveryFullName.trim()) nextErrors.deliveryFullName = 'Informe o nome completo';
    if (!checkoutForm.pickupCity.trim()) nextErrors.pickupCity = 'Informe a cidade';
    if (!checkoutForm.pickupState.trim()) nextErrors.pickupState = 'Informe o estado';
    if (!checkoutForm.pickupPhone.trim()) nextErrors.pickupPhone = 'Informe o telefone';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      addToast('error', 'Seu carrinho está vazio.', 7000);
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        customer_id: customer?.id,
        customer_name: customer?.name,
        phone: customer?.phone ?? checkoutForm.pickupPhone.trim(),
        checkout_phone: checkoutForm.pickupPhone.trim(),
        seller_id: selectedSellerId,
        delivery_full_name: checkoutForm.deliveryFullName.trim(),
        delivery_city: checkoutForm.pickupCity.trim(),
        delivery_state: checkoutForm.pickupState.trim(),
        delivery_reference: checkoutForm.deliveryReference.trim(),
        payment_method: 'tcr_pix',
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      const response = await fetch(buildApiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        addToast('error', data.error || 'Não foi possível gerar o PIX. Tente novamente.', 7000);
        return;
      }

      if (data.debug_payment_fallback) {
        addToast('success', 'Pedido criado em modo debug, mas o PIX falhou. Verifique o backend para detalhes.', 8000);
        clearCart();
        navigate('/minha-conta');
        return;
      }

      if (!data.payment?.qrCode || !data.payment?.paymentString) {
        addToast('error', 'Pedido criado sem dados do QR Code PIX. Tente novamente.', 7000);
        return;
      }

      setPixChargeData({
        orderId: data.id,
        qrCodeId: data.payment.qrCodeId,
        paymentString: data.payment.paymentString,
        qrCode: data.payment.qrCode,
        externalId: data.payment.externalId,
        amount: data.payment.amount,
        expirationDate: data.payment.expirationDate,
      });
      setPixModalOpen(true);
    } catch {
      addToast('error', 'Erro ao finalizar checkout. Tente novamente.', 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <MainLayout settings={settings} onCartClick={() => navigate('/checkout')}>
      <section className={styles.page}>
        <div className={styles.headerRow}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className={styles.title}>Checkout</h1>
        </div>

        <div className={styles.layoutGrid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Retirada na loja</h2>
              <span className={styles.badge}><MapPin size={14} /> Somente retirada</span>
            </div>
            <p className={styles.cardHint}>
              Preencha os dados da pessoa que fará a retirada. O pagamento é via PIX.
            </p>

            <div className={styles.formGrid}>
              <Input
                label="Nome completo de quem vai retirar"
                value={checkoutForm.deliveryFullName}
                onChange={(e) => updateCheckoutField('deliveryFullName', e.target.value)}
                error={errors.deliveryFullName}
                placeholder="Nome completo"
              />

              <Input
                label="Número de Telefone"
                value={checkoutForm.pickupPhone}
                onChange={(e) => updateCheckoutField('pickupPhone', e.target.value)}
                error={errors.pickupPhone}
                placeholder="(DDD) 90000-0000"
              />

              <Input
                label="Cidade"
                value={checkoutForm.pickupCity}
                onChange={(e) => updateCheckoutField('pickupCity', e.target.value)}
                error={errors.pickupCity}
                placeholder="Cidade"
              />

              <Input
                label="Estado"
                value={checkoutForm.pickupState}
                onChange={(e) => updateCheckoutField('pickupState', e.target.value.toUpperCase())}
                error={errors.pickupState}
                placeholder="UF"
              />

              <Input
                label="Observação para retirada"
                value={checkoutForm.deliveryReference}
                onChange={(e) => updateCheckoutField('deliveryReference', e.target.value)}
                placeholder="Ex.: retirar amanhã à tarde"
              />

              <div className={styles.sellerWrap}>
                <label className={styles.label}>Vendedor</label>
                <select
                  className={`${styles.select} ${errors.seller ? styles.selectError : ''}`}
                  value={selectedSellerId}
                  onChange={(e) => {
                    setSelectedSellerId(e.target.value);
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.seller;
                      return next;
                    });
                  }}
                >
                  <option value="">Selecione um vendedor</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>{seller.name}</option>
                  ))}
                </select>
                {errors.seller && <span className={styles.error}>{errors.seller}</span>}
              </div>
            </div>
          </article>

          <aside className={styles.summary}>
            <h3>Resumo do pedido</h3>
            <div className={styles.items}>
              {cartItems.length === 0 ? (
                <p className={styles.empty}>Seu carrinho está vazio.</p>
              ) : cartItems.map((item) => (
                <div key={item.product.id} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <img src={assetUrl(item.product.image_url)} alt={item.product.name} className={styles.thumb} />
                    <div>
                      <p className={styles.itemName}>{item.product.name}</p>
                      <p className={styles.itemQty}>Qtd: {item.quantity}</p>
                    </div>
                  </div>
                  <strong>{formatCurrency(item.product.price * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.totalRow}>
              <span>{itemCount} item(ns)</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <button
              className={styles.payBtn}
              onClick={handleSubmit}
              disabled={isSubmitting || cartItems.length === 0}
            >
              {isSubmitting ? <><Loader2 size={16} className={styles.spin} /> Gerando PIX...</> : <><QrCode size={16} /> Pagar com PIX</>}
            </button>
          </aside>
        </div>
      </section>

      {pixChargeData && (
        <PixPaymentModal
          isOpen={pixModalOpen}
          orderId={pixChargeData.orderId}
          amount={pixChargeData.amount}
          qrCode={pixChargeData.qrCode}
          paymentString={pixChargeData.paymentString}
          externalId={pixChargeData.externalId}
          expirationDate={pixChargeData.expirationDate}
          onClose={() => {
            setPixModalOpen(false);
            clearCart();
            navigate('/minha-conta');
            addToast('success', 'PIX gerado. Depois do pagamento, envie o comprovante na área de pedidos.', 7000);
          }}
          onCancel={() => {
            setPixModalOpen(false);
            clearCart();
            navigate('/minha-conta');
            addToast('success', 'PIX gerado. Depois do pagamento, envie o comprovante na área de pedidos.', 7000);
          }}
          cancelLabel="Fechar por agora"
          closeLabel="Continuar vendo o PIX"
        />
      )}

      <Toast toasts={toasts} onClose={removeToast} />
    </MainLayout>
  );
};

export default Checkout;
