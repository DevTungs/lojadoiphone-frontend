import React from 'react';
import { Award } from 'lucide-react';
import type { Seller } from '../../../types/index';
import SellerBar from '../../molecules/SellerBar/SellerBar';
import styles from './SellerRanking.module.css';

interface SellerRankingProps {
  sellers: Seller[];
}

const SellerRanking: React.FC<SellerRankingProps> = ({ sellers }) => {
  const totalSales = sellers.reduce((sum, seller) => sum + (seller.sales_count ?? 0), 0);
  const maxSales = sellers.length > 0 ? Math.max(...sellers.map((s) => s.sales_count ?? 0)) : 0;

  const sorted = [...sellers].sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0));

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Award size={22} className={styles.icon} />
          <h2 className={styles.title}>Ranking de Vendedores</h2>
        </div>
        {sellers.length > 0 && (
          <p className={styles.subtitle}>
            {sellers.length} vendedor{sellers.length !== 1 ? 'es' : ''} &middot;{' '}
            {totalSales} venda{totalSales !== 1 ? 's' : ''} no total
          </p>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Nenhum vendedor cadastrado</p>
        </div>
      ) : (
        <div className={styles.list}>
          {sorted.map((seller, index) => (
            <SellerBar
              key={seller.id}
              rank={index + 1}
              name={seller.name}
              photoUrl={seller.photo_url || undefined}
              salesCount={seller.sales_count ?? 0}
              maxSales={maxSales}
              isTop={index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SellerRanking;
