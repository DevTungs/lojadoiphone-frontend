import React from 'react';
import type { ReactNode } from 'react';
import styles from './FeatureCard.module.css';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  text: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, text }) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
