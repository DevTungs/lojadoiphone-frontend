import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import Input from '../../../components/atoms/Input/Input'
import Button from '../../../components/atoms/Button/Button'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch {
      setError('E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#19c6a3" />
              <path d="M16 7C11.03 7 7 11.03 7 16s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 2c1.54 0 2.96.49 4.12 1.3L9.3 20.12A6.96 6.96 0 0 1 9 18c0-3.86 3.14-7 7-7zm0 14c-1.54 0-2.96-.49-4.12-1.3l10.82-10.82A6.96 6.96 0 0 1 23 18c0 3.86-3.14 7-7 7z" fill="white" />
            </svg>
          </div>
          <h1 className={styles.title}>Painel Admin</h1>
          <p className={styles.subtitle}>Loja do iPhone — Área restrita</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <Input
              id="email"
              type="email"
              placeholder="admin@loja.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Senha</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
