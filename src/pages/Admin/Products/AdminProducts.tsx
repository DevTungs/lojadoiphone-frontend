import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Edit2, Trash2, X, Upload, Link } from 'lucide-react'
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout'
import Button from '../../../components/atoms/Button/Button'
import Input from '../../../components/atoms/Input/Input'
import Badge from '../../../components/atoms/Badge/Badge'
import Spinner from '../../../components/atoms/Spinner/Spinner'
import TableSkeleton from '../../../components/atoms/TableSkeleton/TableSkeleton'
import ConfirmDialog from '../../../components/atoms/ConfirmDialog/ConfirmDialog'
import {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../services/api'
import { formatCurrency } from '../../../utils/formatters'
import { assetUrl } from '../../../utils/assetUrl'
import type { Product } from '../../../types/index'
import { PRODUCT_CATEGORIES } from '../../../types/index'
import styles from './AdminProducts.module.css'

interface ProductForm {
  name: string
  description: string
  price: string
  storage: string
  color: string
  image_url: string
  stock: string
  active: number
  is_vip: number
  category: string
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  storage: '',
  color: '',
  image_url: '',
  stock: '',
  active: 1,
  is_vip: 0,
  category: 'iPhones',
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url')
  const [uploadPreview, setUploadPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  async function fetchProducts() {
    try {
      setLoading(true)
      const res = await getAllProductsAdmin()
      setProducts(res.data)
    } catch {
      setError('Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setUploadPreview('')
    setImageTab('url')
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      storage: product.storage,
      color: product.color,
      image_url: product.image_url,
      stock: String(product.stock),
      active: product.active,
      is_vip: product.is_vip ?? 0,
      category: product.category ?? 'iPhones',
    })
    setUploadPreview(product.image_url || '')
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
      setForm((prev) => ({ ...prev, image_url: json.url! }))
      setUploadPreview(json.url)
    } catch {
      setFormError('Erro ao enviar imagem. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  function handleDelete(product: Product) {
    setProductToDelete(product)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!productToDelete) return
    setConfirmOpen(false)
    try {
      await deleteProduct(productToDelete.id)
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
    } catch {
      // silently ignore
    }
    setProductToDelete(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.name.trim() || !form.price || !form.color) {
      setFormError('Preencha os campos obrigatórios: nome, preço e cor.')
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      storage: form.storage.trim(),
      color: form.color.trim(),
      image_url: form.image_url.trim(),
      stock: parseInt(form.stock) || 0,
      active: form.active,
      is_vip: form.is_vip,
      category: form.category,
    }

    setSaving(true)
    try {
      if (editing) {
        const res = await updateProduct(editing.id, payload)
        setProducts((prev) =>
          prev.map((p) => (p.id === editing.id ? res.data : p))
        )
      } else {
        const res = await createProduct(payload)
        setProducts((prev) => [res.data, ...prev])
      }
      closeModal()
    } catch {
      setFormError('Erro ao salvar produto. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Produtos">
      <div className={styles.toolbar}>
        <p className={styles.count}>{products.length} produto(s)</p>
        <Button onClick={openCreate} className={styles.addBtn}>
          <Plus size={16} />
          Novo Produto
        </Button>
      </div>

      {error ? (
        <div className={styles.center}><p className={styles.errorText}>{error}</p></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Storage</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton columns={7} /> : products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className={styles.productCell}>
                      {product.image_url ? (
                        <img
                          src={assetUrl(product.image_url)}
                          alt={product.name}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.thumbnailPlaceholder} />
                      )}
                      <span className={styles.productName}>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.category ?? 'iPhones'}</td>
                  <td>{product.storage}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <Badge variant={product.active ? 'success' : 'default'}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openEdit(product)}
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(product)}
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    Nenhum produto cadastrado.
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
              <h2 className={styles.modalTitle}>
                {editing ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className={styles.formError}>{formError}</div>
            )}

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Nome *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: iPhone 15 Pro"
                    required
                  />
                </div>

                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Descrição</label>
                  <textarea
                    className={styles.textarea}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrição do produto..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>Preço (R$) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>Estoque</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>Armazenamento</label>
                  <Input
                    value={form.storage}
                    onChange={(e) => setForm({ ...form, storage: e.target.value })}
                    placeholder="Ex: 256GB"
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>Cor *</label>
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="Ex: Preto Natural"
                    required
                  />
                </div>

                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Imagem do produto</label>
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
                      value={form.image_url}
                      onChange={(e) => {
                        setForm({ ...form, image_url: e.target.value })
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
                          <span className={styles.uploadText}>Clique para selecionar uma imagem</span>
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

                  {(uploadPreview || form.image_url) && (
                    <div className={styles.previewRow}>
                      <img
                        src={uploadPreview || form.image_url}
                        alt="Preview"
                        className={styles.previewThumb}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <span className={styles.previewLabel}>Preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className={styles.fieldLabel}>Status</label>
                  <select
                    className={styles.select}
                    value={form.active}
                    onChange={(e) => setForm({ ...form, active: Number(e.target.value) })}
                  >
                    <option value={1}>Ativo</option>
                    <option value={0}>Inativo</option>
                  </select>
                </div>

                <div>
                  <label className={styles.fieldLabel}>Visibilidade</label>
                  <select
                    className={styles.select}
                    value={form.is_vip}
                    onChange={(e) => setForm({ ...form, is_vip: Number(e.target.value) })}
                  >
                    <option value={0}>Público</option>
                    <option value={1}>Somente VIP</option>
                  </select>
                </div>

                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Categoria</label>
                  <select
                    className={styles.select}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar produto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir produto"
        message={`Tem certeza que deseja excluir "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setProductToDelete(null) }}
      />
    </AdminLayout>
  )
}
