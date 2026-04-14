import React from 'react';
import styles from './CartItem.module.css';
import type { CartItem as CartItemType } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { assetUrl } from '../../../utils/assetUrl';

interface CartItemProps {
  item: CartItemType;
  onRemove: (productId: number) => void;
  onUpdateQty: (productId: number, qty: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQty }) => {
  const { product, quantity } = item;

  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQty(product.id, quantity - 1);
    } else {
      onRemove(product.id);
    }
  };

  const handleIncrease = () => {
    if (quantity < product.stock) {
      onUpdateQty(product.id, quantity + 1);
    }
  };

  return (
    <div className={styles.item}>
      <div className={styles.imageWrapper}>
        <img
          src={assetUrl(product.image_url)}
          alt={product.name}
          className={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/60x60/f5f5f7/999?text=IMG';
          }}
        />
      </div>

      <div className={styles.info}>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.meta}>
          {product.storage} &bull; {product.color}
        </p>
      </div>

      <div className={styles.qtyControl}>
        <button
          className={styles.qtyBtn}
          onClick={handleDecrease}
          aria-label="Diminuir quantidade"
        >
          &minus;
        </button>
        <span className={styles.qty}>{quantity}</span>
        <button
          className={styles.qtyBtn}
          onClick={handleIncrease}
          disabled={quantity >= product.stock}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>

      <p className={styles.price}>{formatCurrency(product.price * quantity)}</p>

      <button
        className={styles.removeBtn}
        onClick={() => onRemove(product.id)}
        aria-label={`Remover ${product.name} do carrinho`}
      >
        &times;
      </button>
    </div>
  );
};

export default CartItem;
