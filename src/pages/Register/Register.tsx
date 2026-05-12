import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle, UserPlus, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { registerCustomer } from '../../services/api'
import styles from './Register.module.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Nome e telefone são obrigatórios.')
      return
    }
    if (!form.password) {
      setError('Crie uma senha para sua conta.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setSaving(true)
    try {
      await registerCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setError('Este telefone já está cadastrado.')
      } else {
        setError('Erro ao realizar cadastro. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <Link to="/" className={styles.backButton} title="Voltar para página inicial">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <div className={styles.card}>
          <div className={styles.successIcon}><CheckCircle size={48} /></div>
          <h2 className={styles.successTitle}>Cadastro realizado!</h2>
          <p className={styles.successText}>Sua conta foi criada. Agora você pode entrar.</p>
          <Link to="/login" className={styles.backLink}>Ir para o login →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backButton} title="Voltar para página inicial">
        <ArrowLeft size={20} />
        <span>Voltar</span>
      </Link>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}><UserPlus size={28} /></div>
          <h1 className={styles.title}>Criar conta</h1>
          <p className={styles.subtitle}>Registre-se para acompanhar seus pedidos</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Nome completo *</label>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome completo"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Telefone (WhatsApp) *</label>
            <input
              className={styles.input}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
              placeholder="Ex: 5511999999999"
              type="tel"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>E-mail</label>
            <input
              className={styles.input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              type="email"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Senha *</label>
            <input
              className={styles.input}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              type="password"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Confirmar senha *</label>
            <input
              className={styles.input}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Repita a senha"
              type="password"
            />
          </div>
          <button className={styles.submitBtn} type="submit" disabled={saving}>
            {saving ? 'Cadastrando...' : 'Criar conta'}
          </button>
          <p className={styles.loginLink}>
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
