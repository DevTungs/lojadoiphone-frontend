import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../Button/Button'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true">
        <div className={styles.iconWrap}>
          <AlertTriangle size={28} className={styles.icon} />
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
