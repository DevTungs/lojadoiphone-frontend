import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react'
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout'
import Button from '../../../components/atoms/Button/Button'
import Input from '../../../components/atoms/Input/Input'
import Badge from '../../../components/atoms/Badge/Badge'
import Spinner from '../../../components/atoms/Spinner/Spinner'
import ConfirmDialog from '../../../components/atoms/ConfirmDialog/ConfirmDialog'
import {
  getAllPromotionsAdmin,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../../../services/api'
import { assetUrl } from '../../../utils/assetUrl'
import type { Promotion } from '../../../types/index'
import styles from './AdminPromotions.module.css'

interface PromotionForm {
  title: string
  image_url: string
  link_url: string
  price: string
  active: number
  sort_order: string
}

const emptyForm: PromotionForm = {
  title: '',
  image_url: '',
  link_url: '',
  price: '',
  active: 1,
  sort_order: '0',
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [form, setForm] = useState<PromotionForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadPreview, setUploadPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null)

  async function fetchPromotions() {
    try {
      setLoading(true)
      const res = await getAllPromotionsAdmin()
      setPromotions(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPromotions() }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setUploadPreview('')
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(promo: Promotion) {
    setEditing(promo)
    setForm({
      title: promo.title,
      image_url: promo.image_url ?? '',
      link_url: promo.link_url ?? '',
      price: String(promo.price),
      active: promo.active,
      sort_order: String(promo.sort_order),
    })
    setUploadPreview(promo.image_url ?? '')
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setUploadPreview('')
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      setForm(prev => ({ ...prev, image_url: data.url }))
      setUploadPreview(data.url)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Título é obrigatório.'); return }
    if (!form.price || isNaN(Number(form.price))) { setFormError('Valor inválido.'); return }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        title: form.title.trim(),
        image_url: form.image_url || null,
        link_url: form.link_url.trim() || null,
        price: parseFloat(form.price),
        active: form.active,
        sort_order: parseInt(form.sort_order) || 0,
      }
      if (editing) {
        const res = await updatePromotion(editing.id, payload)
        setPromotions(prev => prev.map(p => p.id === editing.id ? res.data : p))
      } else {
        const res = await createPromotion(payload)
        setPromotions(prev => [res.data, ...prev])
      }
      closeModal()
    } catch {
      setFormError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function askDelete(promo: Promotion) {
    setPromoToDelete(promo)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (!promoToDelete) return
    await deletePromotion(promoToDelete.id)
    setPromotions(prev => prev.filter(p => p.id !== promoToDelete.id))
    setConfirmOpen(false)
    setPromoToDelete(null)
  }

  return (
    <AdminLayout title="Promoções" subtitle="Gerencie as ofertas da semana exibidas na home">
      <div className={styles.toolbar}>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Nova Promoção
        </Button>
      </div>

      {loading ? (
        <div className={styles.center}><Spinner /></div>
      ) : promotions.length === 0 ? (
        <div className={styles.empty}>Nenhuma promoção cadastrada ainda.</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Foto</span>
            <span>Título</span>
            <span>Valor</span>
            <span>Ordem</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {promotions.map(promo => (
            <div key={promo.id} className={styles.tableRow}>
              <div className={styles.imgCell}>
                {promo.image_url
                  ? <img src={promo.image_url} alt={promo.title} className={styles.thumb} />
                  : <div className={styles.thumbEmpty} />
                }
              </div>
              <span className={styles.titleCell}>{promo.title}</span>
              <span>
                {promo.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
              <span>{promo.sort_order}</span>
              <span>
                <Badge variant={promo.active ? 'success' : 'default'}>
                  {promo.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </span>
              <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={() => openEdit(promo)} title="Editar">
                  <Edit2 size={16} />
                </button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => askDelete(promo)} title="Excluir">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editing ? 'Editar Promoção' : 'Nova Promoção'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Título"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: iPhone 15 Pro — Oferta da Semana"
              />

              <div className={styles.uploadArea}>
                <label className={styles.uploadLabel}>Foto</label>
                {uploadPreview && (
                  <img src={uploadPreview} alt="Preview" className={styles.preview} />
                )}
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Spinner /> : <><Upload size={16} /> Enviar foto</>}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }}
                />
                {form.image_url && !uploading && (
                  <p className={styles.urlHint}>{form.image_url}</p>
                )}
              </div>

              <Input
                label="Valor ($)"
                type="number"
                value={form.price}
                onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="4999.90"
              />

              <Input
                label="Ordem de exibição"
                type="number"
                value={form.sort_order}
                onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
                placeholder="0"
              />

              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.active === 1}
                  onChange={e => setForm(prev => ({ ...prev, active: e.target.checked ? 1 : 0 }))}
                />
                Ativa (visível na home)
              </label>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.modalFooter}>
                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner /> : editing ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir promoção"
        message={`Deseja excluir "${promoToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setPromoToDelete(null) }}
      />
    </AdminLayout>
  )
}
