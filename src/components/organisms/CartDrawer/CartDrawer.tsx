import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Seller } from '../../../types/index';
import { useCart } from '../../../contexts/CartContext';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { formatCurrency } from '../../../utils/formatters';
import { assetUrl } from '../../../utils/assetUrl';
import { buildApiUrl } from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../atoms/Toast/Toast';
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

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onLoginRequired, preselectedSellerId, preselectedSellerName, lockSeller }) => {
  const navigate = useNavigate();
  const { items: cartItems, removeItem: removeFromCart, updateQuantity, total } = useCart();
  const { customer, isLoggedIn } = useCustomerAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(preselectedSellerId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toasts, removeToast } = useToast();

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
    const newErrors: Record<string, string> = {};
    if (!selectedSellerId) {
      newErrors.seller = 'Selecione um vendedor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoToCheckout = async () => {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    if (!validate()) return;

    onClose();
    navigate('/checkout', {
      state: {
        preselectedSellerId: selectedSellerId,
        preselectedSellerName: lockSeller
          ? (preselectedSellerName ?? sellers.find((s) => String(s.id) === String(selectedSellerId))?.name)
          : undefined,
        lockSeller: !!lockSeller,
      },
    });
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
                    <span className={styles.label}>Conta:</span>
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
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.seller;
                          return next;
                        });
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
                  onClick={handleGoToCheckout}
                  disabled={(!lockSeller && !selectedSellerId) || (!!lockSeller && !preselectedSellerId)}
                >
                  Ir para checkout
                </button>
              </>
            )}
          </div>
        )}
      </aside>
      <Toast toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default CartDrawer;
