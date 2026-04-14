import React from 'react';
import type { ReactNode } from 'react';
import styles from './InfoCard.module.css';

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, subtitle }) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon}
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
};

export default InfoCard;
