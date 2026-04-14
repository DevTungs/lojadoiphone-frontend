import { useState, useCallback } from 'react'
import type { ToastMessage } from '../components/atoms/Toast/Toast'

let nextId = 1

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
