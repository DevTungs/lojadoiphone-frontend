import React, { useState } from 'react';
import styles from './ProductCard.module.css';
import type { Product } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { assetUrl } from '../../../utils/assetUrl';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuy: (product: Product, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onBuy }) => {
  const inStock = product.stock > 0 && product.active === 1;
  const [qty, setQty] = useState(1);

  const changeQty = (delta: number) =>
    setQty(prev => Math.min(Math.max(1, prev + delta), product.stock));

  return (
    <div className={`${styles.card} ${!inStock ? styles.outOfStock : ''}`}>
      <div className={styles.imageWrapper}>
        <img
          src={assetUrl(product.image_url)}
          alt={product.name}
          className={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/300x300/f5f5f7/999?text=iPhone';
          }}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.tags}>
          {product.storage && <span className={styles.tag}>{product.storage}</span>}
          <span className={`${styles.tag} ${inStock ? styles.tagInStock : styles.tagOutOfStock}`}>
            {inStock ? `${product.stock} em estoque` : 'Sem estoque'}
          </span>
        </div>

        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>{formatCurrency(product.price)}</p>

        {inStock && (
          <div className={styles.qtyRow}>
            <button className={styles.qtyBtn} onClick={() => changeQty(-1)} aria-label="Diminuir">−</button>
            <input
              type="number"
              className={styles.qtyInput}
              value={qty}
              min={1}
              max={product.stock}
              onChange={(e) => {
                const val = Math.min(Math.max(1, Number(e.target.value)), product.stock);
                setQty(isNaN(val) ? 1 : val);
              }}
            />
            <button className={styles.qtyBtn} onClick={() => changeQty(1)} aria-label="Aumentar">+</button>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.btnCart}
            onClick={() => onAddToCart(product, qty)}
            disabled={!inStock}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            Adicionar ao carrinho
          </button>
          <button
            className={styles.btnBuy}
            onClick={() => onBuy(product, qty)}
            disabled={!inStock}
            aria-label={`Comprar ${product.name}`}
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
