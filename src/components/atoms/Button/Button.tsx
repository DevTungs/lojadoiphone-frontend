import React from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';
import Spinner from '../Spinner/Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const spinnerColor = variant === 'primary' || variant === 'danger' ? 'white' : 'mint';

  const classNames = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classNames}
      {...rest}
    >
      {loading ? (
        <span className={styles.loadingContent}>
          <Spinner size="sm" color={spinnerColor} />
          {children}
        </span>
      ) : (
        <>
          {leftIcon && leftIcon}
          {children}
          {rightIcon && rightIcon}
        </>
      )}
    </button>
  );
};

export default Button;
