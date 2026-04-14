import React from 'react';
import styles from './Spinner.module.css';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'mint' | 'white' | 'gray';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'mint' }) => {
  const classNames = [styles.spinner, styles[size], styles[color]].join(' ');

  return <span className={classNames} role="status" aria-label="Carregando" />;
};

export default Spinner;
