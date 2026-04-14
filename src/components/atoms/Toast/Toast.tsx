import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import styles from './Toast.module.css'

export interface ToastMessage {
  id: number
  type: 'success' | 'error'
  message: string
}

interface ToastProps {
  toasts: ToastMessage[]
  onClose: (id: number) => void
}

export default function Toast({ toasts, onClose }: ToastProps) {
  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onClose])

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      <span className={styles.msg}>{toast.message}</span>
      <button className={styles.closeBtn} onClick={() => onClose(toast.id)}>
        <X size={14} />
      </button>
    </div>
  )
}
