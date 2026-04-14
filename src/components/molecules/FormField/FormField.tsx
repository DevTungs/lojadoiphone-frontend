import React from 'react';
import type { ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  children,
}) => {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required} aria-hidden="true">*</span>}
      </label>

      <div className={styles.control}>{children}</div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
};

export default FormField;
