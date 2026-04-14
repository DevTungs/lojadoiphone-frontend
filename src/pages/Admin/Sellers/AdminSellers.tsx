import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Edit2, Trash2, X, Upload, Link, BarChart2, ChevronLeft } from 'lucide-react'
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout'
import Button from '../../../components/atoms/Button/Button'
import Input from '../../../components/atoms/Input/Input'
import Spinner from '../../../components/atoms/Spinner/Spinner'
import TableSkeleton from '../../../components/atoms/TableSkeleton/TableSkeleton'
import ConfirmDialog from '../../../components/atoms/ConfirmDialog/ConfirmDialog'
import {
  getSellers,
  createSeller,
  updateSeller,
  deleteSeller,
  getSellerStats,
} from '../../../services/api'
import type { SellerStats } from '../../../services/api'
import { formatCurrency } from '../../../utils/formatters'
import { assetUrl } from '../../../utils/assetUrl'
import type { Seller } from '../../../types/index'
import styles from './AdminSellers.module.css'

interface SellerForm {
  name: string
  phone: string
  photo_url: string
  slug: string
}

const emptyForm: SellerForm = { name: '', phone: '', photo_url: '', slug: '' }

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Seller | null>(null)
  const [form, setForm] = useState<SellerForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url')
  const [uploadPreview, setUploadPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null)

  // Stats panel
  const [statsPanel, setStatsPanel] = useState(false)
  const [statsSeller, setStatsSeller] = useState<Seller | null>(null)
  const [statsData, setStatsData] = useState<SellerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly')
  const [statsFrom, setStatsFrom] = useState('')
  const [statsTo, setStatsTo] = useState('')

  async function fetchSellers() {
    try {
      setLoading(true)
      const res = await getSellers()
      setSellers(res.data)
    } catch {
      setError('Erro ao carregar vendedores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setUploadPreview('')
    setImageTab('url')
    setModalOpen(true)
  }

  function openEdit(seller: Seller) {
    setEditing(seller)
    setForm({ name: seller.name, phone: seller.phone ?? '', photo_url: seller.photo_url ?? '', slug: seller.slug ?? '' })
    setUploadPreview(seller.photo_url || '')
    setImageTab('url')
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setUploadPreview('')
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const token = localStorage.getItem('auth_token')
    const data = new FormData()
    data.append('image', file)

    setUploading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })
      const text = await res.text()
      let json: { url?: string; error?: string } = {}
      try { json = JSON.parse(text) } catch { /* not JSON */ }
      if (!res.ok) throw new Error(json.error ?? `Erro no upload (${res.status})`)
      if (!json.url) throw new Error('Servidor não retornou URL da imagem')
      setForm((prev) => ({ ...prev, photo_url: json.url! }))
      setUploadPreview(json.url)
    } catch {
      setFormError('Erro ao enviar imagem. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  function handleDelete(seller: Seller) {
    setSellerToDelete(seller)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!sellerToDelete) return
    setConfirmOpen(false)
    try {
      await deleteSeller(sellerToDelete.id)
      setSellers((prev) => prev.filter((s) => s.id !== sellerToDelete.id))
    } catch {
      // silently ignore
    }
    setSellerToDelete(null)
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10)
  }

  function daysAgoStr(days: number) {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d.toISOString().slice(0, 10)
  }

  async function openStats(seller: Seller) {
    const from = daysAgoStr(29)
    const to = todayStr()
    setStatsSeller(seller)
    setStatsPanel(true)
    setStatsData(null)
    setStatsPeriod('monthly')
    setStatsFrom(from)
    setStatsTo(to)
    await loadStats(seller.id, from, to)
  }

  async function loadStats(id: number, from: string, to: string) {
    setStatsLoading(true)
    try {
      const res = await getSellerStats(id, { from, to })
      setStatsData(res.data)
    } catch {
      // ignore
    } finally {
      setStatsLoading(false)
    }
  }

  async function handlePreset(p: 'daily' | 'weekly' | 'monthly') {
    if (!statsSeller) return
    const to = todayStr()
    const from = p === 'daily' ? todayStr() : p === 'weekly' ? daysAgoStr(6) : daysAgoStr(29)
    setStatsPeriod(p)
    setStatsFrom(from)
    setStatsTo(to)
    await loadStats(statsSeller.id, from, to)
  }

  async function handleDateChange(newFrom: string, newTo: string) {
    setStatsPeriod('custom')
    setStatsFrom(newFrom)
    setStatsTo(newTo)
    if (statsSeller && newFrom && newTo) {
      await loadStats(statsSeller.id, newFrom, newTo)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('O nome do vendedor é obrigatório.')
      return
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      photo_url: form.photo_url.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
    }

    setSaving(true)
    try {
      if (editing) {
        const res = await updateSeller(editing.id, payload)
        setSellers((prev) =>
          prev.map((s) => (s.id === editing.id ? res.data : s))
        )
      } else {
        const res = await createSeller(payload)
        setSellers((prev) => [...prev, res.data])
      }
      closeModal()
    } catch {
      setFormError('Erro ao salvar vendedor. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Vendedores">
      <div className={styles.toolbar}>
        <p className={styles.count}>{sellers.length} vendedor(es)</p>
        <Button onClick={openCreate} className={styles.addBtn}>
          <Plus size={16} />
          Novo Vendedor
        </Button>
      </div>

      {error ? (
        <div className={styles.center}><p className={styles.errorText}>{error}</p></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Telefone</th>
                <th>Total de Vendas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton columns={4} /> : sellers.map((seller) => (
                <tr key={seller.id}>
                  <td>
                    <div className={styles.sellerCell}>
                      {seller.photo_url ? (
                        <img src={seller.photo_url} alt={seller.name} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {seller.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={styles.sellerName}>{seller.name}</span>
                    </div>
                  </td>
                  <td>{seller.phone || '—'}</td>
                  <td>{seller.sales_count ?? 0} pedido(s)</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnStats}`}
                        onClick={() => openStats(seller)}
                        title="Ver estatísticas"
                      >
                        <BarChart2 size={15} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openEdit(seller)}
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(seller)}
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && sellers.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    Nenhum vendedor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className={styles.modal}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editing ? 'Editar Vendedor' : 'Novo Vendedor'}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className={styles.formError}>{formError}</div>
            )}

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nome *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do vendedor"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Telefone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+55 11 99999-9999"
                  type="tel"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Link personalizado (slug)</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Ex: paulo"
                />
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                  Clientes acessam via <strong>/vendedor/{form.slug || 'nome'}</strong> e o vendedor é pré-selecionado
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Foto do vendedor</label>
                <div className={styles.imageTabs}>
                  <button
                    type="button"
                    className={`${styles.imageTab} ${imageTab === 'url' ? styles.imageTabActive : ''}`}
                    onClick={() => setImageTab('url')}
                  >
                    <Link size={14} /> URL
                  </button>
                  <button
                    type="button"
                    className={`${styles.imageTab} ${imageTab === 'upload' ? styles.imageTabActive : ''}`}
                    onClick={() => setImageTab('upload')}
                  >
                    <Upload size={14} /> Enviar do computador
                  </button>
                </div>

                {imageTab === 'url' ? (
                  <Input
                    value={form.photo_url}
                    onChange={(e) => {
                      setForm({ ...form, photo_url: e.target.value })
                      setUploadPreview(e.target.value)
                    }}
                    placeholder="https://..."
                  />
                ) : (
                  <div
                    className={styles.uploadArea}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className={styles.uploadLoading}><Spinner size="sm" /> <span>Enviando...</span></div>
                    ) : uploadPreview && imageTab === 'upload' ? (
                      <img src={uploadPreview} alt="Preview" className={styles.uploadPreview} />
                    ) : (
                      <>
                        <Upload size={28} className={styles.uploadIcon} />
                        <span className={styles.uploadText}>Clique para selecionar uma foto</span>
                        <span className={styles.uploadHint}>JPG, PNG, WEBP até 10MB</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.fileInputHidden}
                  onChange={handleFileChange}
                />

                {(uploadPreview || form.photo_url) && (
                  <div className={styles.previewRow}>
                    <img
                      src={uploadPreview || form.photo_url}
                      alt="Preview"
                      className={styles.previewThumb}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span className={styles.previewLabel}>Preview</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar vendedor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Excluir vendedor"
        message={`Tem certeza que deseja excluir "${sellerToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setSellerToDelete(null) }}
      />

      {statsPanel && statsSeller && (
        <div className={styles.statsOverlay} onClick={(e) => { if (e.target === e.currentTarget) setStatsPanel(false) }}>
          <div className={styles.statsPanel}>
            <div className={styles.statsPanelHeader}>
              <button className={styles.statsBackBtn} onClick={() => setStatsPanel(false)}>
                <ChevronLeft size={18} />
              </button>
              <div className={styles.statsSellerInfo}>
                {statsSeller.photo_url ? (
                  <img src={statsSeller.photo_url} alt={statsSeller.name} className={styles.statsAvatar} />
                ) : (
                  <div className={styles.statsAvatarPlaceholder}>{statsSeller.name.charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <h2 className={styles.statsPanelTitle}>{statsSeller.name}</h2>
                  <p className={styles.statsPanelSub}>Estatísticas de vendas</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setStatsPanel(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className={styles.statsPeriodBar}>
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  className={`${styles.periodBtn} ${statsPeriod === p ? styles.periodBtnActive : ''}`}
                  onClick={() => handlePreset(p)}
                >
                  {p === 'daily' ? 'Hoje' : p === 'weekly' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                </button>
              ))}
            </div>

            <div className={styles.customFilter}>
              <div className={styles.dateField}>
                <label className={styles.dateLabel}>De</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={statsFrom}
                  onChange={(e) => handleDateChange(e.target.value, statsTo)}
                />
              </div>
              <span className={styles.dateSep}>—</span>
              <div className={styles.dateField}>
                <label className={styles.dateLabel}>Até</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={statsTo}
                  onChange={(e) => handleDateChange(statsFrom, e.target.value)}
                />
              </div>
            </div>

            {statsLoading ? (
              <div className={styles.statsCenter}><Spinner /></div>
            ) : statsData ? (
              <>
                <div className={styles.statsCards}>
                  <div className={styles.statsCard}>
                    <span className={styles.statsCardLabel}>Total de pedidos</span>
                    <span className={styles.statsCardValue}>{statsData.totals.total_orders}</span>
                  </div>
                  <div className={styles.statsCard}>
                    <span className={styles.statsCardLabel}>Receita total</span>
                    <span className={styles.statsCardValue}>{formatCurrency(statsData.totals.total_revenue)}</span>
                  </div>
                </div>

                {statsData.byDay.length > 0 ? (
                  <div className={styles.statsDayList}>
                    <p className={styles.statsDayTitle}>Vendas por dia</p>
                    {statsData.byDay.map((row) => (
                      <div key={row.day} className={styles.statsDayRow}>
                        <span className={styles.statsDayDate}>
                          {new Date(row.day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <div className={styles.statsDayRight}>
                          <span className={styles.statsDayOrders}>{row.orders} pedido(s)</span>
                          <span className={styles.statsDayRevenue}>{formatCurrency(row.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.statsEmpty}>Nenhuma venda no período selecionado.</div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
