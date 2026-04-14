import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, LogIn } from 'lucide-react';
import type { Seller } from '../../../types/index';
import { useCart } from '../../../contexts/CartContext';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { formatCurrency } from '../../../utils/formatters';
import { assetUrl } from '../../../utils/assetUrl';
import { buildApiUrl } from '../../../services/api';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalize: (sellerId: string) => void;
  onLoginRequired?: () => void;
  preselectedSellerId?: string;
  preselectedSellerName?: string;
  lockSeller?: boolean;
  storeWhatsapp?: string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onFinalize, onLoginRequired, preselectedSellerId, preselectedSellerName, lockSeller, storeWhatsapp }) => {
  const { items: cartItems, removeItem: removeFromCart, updateQuantity, clearCart, total } = useCart();
  const { customer, isLoggedIn } = useCustomerAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(preselectedSellerId ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ seller?: string }>({});

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch(buildApiUrl('/sellers'));
        if (response.ok) {
          const data = await response.json();
          setSellers(data);
        }
      } catch (err) {
        console.error('Erro ao buscar vendedores:', err);
      }
    };

    if (isOpen) {
      fetchSellers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedSellerId) {
      setSelectedSellerId(preselectedSellerId);
    }
  }, [preselectedSellerId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: { seller?: string } = {};
    if (!selectedSellerId) {
      newErrors.seller = 'Selecione um vendedor';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildWhatsAppMessage = (orderId: number | string): string => {
    const itemsText = cartItems
      .map(
        (item) =>
          `• ${item.product.name} (x${item.quantity}) — ${formatCurrency(item.product.price * item.quantity)}`
      )
      .join('\n');

    const message = [
      `Olá! Gostaria de finalizar meu pedido 🛍️`,
      ``,
      `*Pedido #${orderId}*`,
      ``,
      `*Produtos:*`,
      itemsText,
      ``,
      `*Total:* ${formatCurrency(total)}`,
      ``,
      `*Nome:* ${customer?.name ?? 'N/A'}`,
      `*Telefone:* ${customer?.phone ?? 'N/A'}`,
    ].join('\n');

    const phone = (storeWhatsapp ?? '').replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleFinalize = async () => {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(buildApiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer?.id,
          customer_name: customer?.name,
          phone: customer?.phone,
          seller_id: selectedSellerId,
          items: cartItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pedido');
      }

      const order = await response.json();
      const whatsappUrl = buildWhatsAppMessage(order.id);
      window.open(whatsappUrl, '_blank');

      clearCart();
      onFinalize(selectedSellerId);
      onClose();

      setSelectedSellerId('');
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Carrinho</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar carrinho">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingCart size={48} className={styles.emptyIcon} />
              <p className={styles.emptyText}>Seu carrinho está vazio</p>
            </div>
          ) : (
            <ul className={styles.itemList}>
              {cartItems.map((item) => (
                <li key={item.product.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    {item.product.image_url && (
                      <img
                        src={assetUrl(item.product.image_url)}
                        alt={item.product.name}
                        className={styles.itemImage}
                      />
                    )}
                    <div className={styles.itemDetails}>
                      <span className={styles.itemName}>{item.product.name}</span>
                      <span className={styles.itemPrice}>
                        {formatCurrency(item.product.price)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.quantityControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        className={styles.qty}
                        value={item.quantity}
                        min={1}
                        max={item.product.stock}
                        onChange={(e) => {
                          const val = Math.min(Math.max(1, Number(e.target.value)), item.product.stock);
                          if (!isNaN(val)) updateQuantity(item.product.id, val);
                        }}
                        aria-label="Quantidade"
                      />
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles.footer}>
            {!isLoggedIn ? (
              <div className={styles.loginPrompt}>
                <LogIn size={24} />
                <p>Você precisa estar logado para realizar um pedido</p>
                <button
                  className={styles.whatsappBtn}
                  onClick={() => {
                    onClose();
                    onLoginRequired?.();
                  }}
                >
                  Fazer Login
                </button>
              </div>
            ) : (
              <>
                <div className={styles.customerInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Nome:</span>
                    <span className={styles.value}>{customer?.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Telefone:</span>
                    <span className={styles.value}>{customer?.phone}</span>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  {lockSeller && preselectedSellerId ? (
                    <div className={styles.lockedSeller}>
                      Vendedor: <strong>{preselectedSellerName ?? sellers.find((s) => String(s.id) === String(preselectedSellerId))?.name ?? '...'}</strong>
                    </div>
                  ) : (
                    <select
                      className={`${styles.sellerSelect} ${errors.seller ? styles.inputError : ''}`}
                      value={selectedSellerId}
                      onChange={(e) => {
                        setSelectedSellerId(e.target.value);
                        setErrors((prev) => ({ ...prev, seller: undefined }));
                      }}
                    >
                      <option value="">Selecione um vendedor</option>
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.seller && <span className={styles.errorMsg}>{errors.seller}</span>}
                </div>

                <div className={styles.total}>
                  Total: {formatCurrency(total)}
                </div>

                <button
                  className={styles.whatsappBtn}
                  onClick={handleFinalize}
                  disabled={isSubmitting || (!lockSeller && !selectedSellerId) || (!!lockSeller && !preselectedSellerId)}
                >
                  {isSubmitting ? 'Processando...' : 'Finalizar pedido no WhatsApp'}
                </button>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
