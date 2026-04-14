import { forwardRef } from 'react';
import type { ReactNode, InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputClassNames = [
      styles.input,
      leftIcon ? styles.hasLeftIcon : '',
      rightIcon ? styles.hasRightIcon : '',
      error ? styles.inputError : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={inputClassNames}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...rest}
          />
          {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
        </div>
        {error && (
          <span id={`${inputId}-error`} className={styles.error} role="alert">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${inputId}-hint`} className={styles.hint}>
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
