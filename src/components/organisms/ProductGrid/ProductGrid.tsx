import React from 'react';
import type { Product } from '../../../types/index';
import ProductCard from '../../molecules/ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuy: (product: Product, quantity: number) => void;
  title?: string;
  limit?: number;
  footer?: React.ReactNode;
  sortNode?: React.ReactNode;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  onAddToCart,
  onBuy,
  title = 'Produtos em destaque',
  limit,
  footer,
  sortNode,
}) => {
  const displayed = limit ? products.slice(0, limit) : products;

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.titleWrapper}>
              <span className={styles.titleEyebrow}>Catálogo</span>
              <h2 className={styles.title}>{title}</h2>
            </div>
          </div>
          <div className={styles.grid}>
            {Array.from({ length: limit ?? 6 }).map((_, index) => (
              <div key={index} className={styles.skeleton} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.titleWrapper}>
              <span className={styles.titleEyebrow}>Catálogo</span>
              <h2 className={styles.title}>{title}</h2>
            </div>
          </div>
          <div className={styles.empty}>
            <p className={styles.emptyText}>Nenhum produto disponível</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <span className={styles.titleEyebrow}>Catálogo</span>
            <h2 className={styles.title}>{title}</h2>
          </div>
          {sortNode && <div className={styles.sortWrapper}>{sortNode}</div>}
        </div>
        <div className={styles.grid}>
          {displayed.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onBuy={onBuy}
            />
          ))}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </section>
  );
};

export default ProductGrid;
