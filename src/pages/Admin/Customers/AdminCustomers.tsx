import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Edit2, Trash2, X, Star } from 'lucide-react'
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout'
import Button from '../../../components/atoms/Button/Button'
import Input from '../../../components/atoms/Input/Input'
import TableSkeleton from '../../../components/atoms/TableSkeleton/TableSkeleton'
import ConfirmDialog from '../../../components/atoms/ConfirmDialog/ConfirmDialog'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../../../services/api'
import { formatDate } from '../../../utils/formatters'
import type { Customer } from '../../../types/index'
import styles from './AdminCustomers.module.css'

interface CustomerForm {
  name: string
  phone: string
  email: string
  notes: string
  password: string
  is_vip: number
}

const emptyForm: CustomerForm = { name: '', phone: '', email: '', notes: '', password: '', is_vip: 0 }

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  useEffect(() => {
    getCustomers()
      .then((res) => setCustomers(res.data))
      .catch(() => setError('Erro ao carregar clientes.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone, email: c.email ?? '', notes: c.notes ?? '', password: '', is_vip: c.is_vip ?? 0 })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  function handleDelete(c: Customer) {
    setCustomerToDelete(c)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!customerToDelete) return
    setConfirmOpen(false)
    try {
      await deleteCustomer(customerToDelete.id)
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id))
    } catch { /* ignore */ }
    setCustomerToDelete(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError('Nome e telefone são obrigatórios.')
      return
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      password: form.password.trim() || undefined,
      is_vip: form.is_vip,
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await updateCustomer(editing.id, payload)
        setCustomers((prev) => prev.map((c) => (c.id === editing.id ? res.data : c)))
      } else {
        const res = await createCustomer(payload)
        setCustomers((prev) => [res.data, ...prev])
      }
      closeModal()
    } catch {
      setFormError('Erro ao salvar cliente. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Clientes">
      <div className={styles.toolbar}>
        <p className={styles.count}>{customers.length} cliente(s)</p>
        <div className={styles.toolbarRight}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={openCreate} className={styles.addBtn}>
            <Plus size={16} />
            Novo Cliente
          </Button>
        </div>
      </div>

      {error ? (
        <div className={styles.center}><p className={styles.errorText}>{error}</p></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Cadastrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton columns={5} /> : filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.customerName}>{c.name}</span>
                      {!!c.is_vip && (
                        <span className={styles.vipBadge}>
                          <Star size={11} fill="currentColor" /> VIP
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td>{formatDate(c.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => openEdit(c)} title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(c)}
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    {search ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className={styles.modal} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nome *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Telefone *</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="Ex: 5511999999999"
                  type="tel"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>E-mail</label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="cliente@email.com"
                  type="email"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Observações</label>
                <textarea
                  className={styles.textarea}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>
              {!editing && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Senha{' '}
                    <span style={{ fontSize: '0.85em', color: '#666' }}>(deixe vazio para não definir)</span>
                  </label>
                  <Input
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Digite a senha do cliente"
                    type="password"
                  />
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Categoria</label>
                <div className={styles.vipToggleRow}>
                  <button
                    type="button"
                    className={`${styles.vipToggleBtn} ${!form.is_vip ? styles.vipToggleBtnActive : ''}`}
                    onClick={() => setForm({ ...form, is_vip: 0 })}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    className={`${styles.vipToggleBtn} ${form.is_vip ? styles.vipToggleBtnVip : ''}`}
                    onClick={() => setForm({ ...form, is_vip: 1 })}
                  >
                    <Star size={14} fill={form.is_vip ? 'currentColor' : 'none'} />
                    VIP
                  </button>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir "${customerToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setCustomerToDelete(null) }}
      />
    </AdminLayout>
  )
}
