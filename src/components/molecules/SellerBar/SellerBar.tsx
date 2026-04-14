import React from 'react';
import styles from './SellerBar.module.css';
import { assetUrl } from '../../../utils/assetUrl';

interface SellerBarProps {
  name: string;
  photoUrl?: string;
  salesCount: number;
  maxSales: number;
  isTop: boolean;
  rank: number;
}

const SellerBar: React.FC<SellerBarProps> = ({
  name,
  photoUrl,
  salesCount,
  maxSales,
  isTop,
  rank,
}) => {
  const widthPercent = maxSales > 0 ? Math.round((salesCount / maxSales) * 100) : 0;

  return (
    <div className={`${styles.row} ${isTop ? styles.rowTop : ''}`}>
      <span className={styles.rank}>#{rank}</span>

      {photoUrl ? (
        <img src={assetUrl(photoUrl)} alt={name} className={styles.avatar} />
      ) : (
        <div className={`${styles.avatarFallback} ${isTop ? styles.avatarFallbackTop : ''}`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <span className={`${styles.name} ${isTop ? styles.nameTop : ''}`}>
        {name}
      </span>

      <div className={styles.barTrack} aria-label={`${widthPercent}% do máximo`}>
        <div
          className={`${styles.barFill} ${isTop ? styles.barFillTop : styles.barFillDefault}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>

      <span className={styles.count}>
        {salesCount} {salesCount === 1 ? 'venda' : 'vendas'}
      </span>
    </div>
  );
};

export default SellerBar;
