import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, ArrowLeft } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import styles from './CustomerLogin.module.css'

export default function CustomerLogin() {
  const { login } = useCustomerAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(phone.trim(), password)
      navigate('/minha-conta')
    } catch (err: unknown) {
      setError((err as Error).message || 'Telefone ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backButton} title="Voltar para página inicial">
        <ArrowLeft size={20} />
        <span>Voltar</span>
      </Link>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}><LogIn size={28} /></div>
          <h1 className={styles.title}>Entrar na minha conta</h1>
          <p className={styles.subtitle}>Acompanhe seus pedidos e histórico de compras</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Telefone (WhatsApp)</label>
            <input
              id="phone"
              type="tel"
              className={styles.input}
              placeholder="Ex: 5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              required
              autoComplete="tel"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.registerLink}>
          Não tem cadastro?{' '}
          <Link to="/cadastro">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
