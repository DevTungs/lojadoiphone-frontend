import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Edit2, Trash2, X, Upload, Link, TrendingUp } from 'lucide-react'
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
  cost_price: string
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
  cost_price: '',
  storage: '',
  color: '',
  image_url: '',
  stock: '',
  active: 1,
  is_vip: 0,
  category: 'iPhones',
}

// ─── Helpers de precificação ─────────────────────────────────────────────────

function calcSaleFromMargin(cost: number, marginPct: number): number {
  if (marginPct >= 100) return 0
  return cost / (1 - marginPct / 100)
}

function calcSaleFromMarkup(cost: number, markupPct: number): number {
  return cost * (1 + markupPct / 100)
}

function calcMarginPct(cost: number, sale: number): number {
  if (sale <= 0) return 0
  return ((sale - cost) / sale) * 100
}

function calcMarkupPct(cost: number, sale: number): number {
  if (cost <= 0) return 0
  return ((sale - cost) / cost) * 100
}

function fmt2(n: number): string {
  return n.toFixed(2)
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // Calculadora: % em cima do custo (markup)
  const [pctField, setPctField] = useState('')

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

  useEffect(() => { fetchProducts() }, [])

  // Atualiza o campo % a partir dos preços
  function refreshPct(costStr: string, priceStr: string) {
    const cost = parseFloat(costStr)
    const sale = parseFloat(priceStr)
    if (cost > 0 && sale > 0) {
      setPctField(fmt2(calcMarkupPct(cost, sale)))
    } else {
      setPctField('')
    }
  }


  // Quando o usuário digita no campo de custo
  // → apenas atualiza a % de exibição. Nunca mexe no preço de venda.
  function handleCostChange(val: string) {
    setForm(prev => ({ ...prev, cost_price: val }))
    refreshPct(val, form.price)
  }

  // Quando o usuário digita no campo de %
  function handlePctChange(val: string) {
    setPctField(val)
    const pct = parseFloat(val)
    const cost = parseFloat(form.cost_price)
    if (!isNaN(pct) && cost > 0 && pct >= 0) {
      setForm(prev => ({ ...prev, price: fmt2(calcSaleFromMarkup(cost, pct)) }))
    }
  }

  // Quando o usuário digita no campo de preço de venda
  function handleSaleChange(val: string) {
    setForm(prev => ({ ...prev, price: val }))
    refreshPct(form.cost_price, val)
  }

  // Resultado calculado (só exibe se ambos preenchidos)
  const cost = parseFloat(form.cost_price)
  const sale = parseFloat(form.price)
  const hasBothPrices = cost > 0 && sale > 0
  const profit = hasBothPrices ? sale - cost : null
  const markupPct = hasBothPrices ? calcMarkupPct(cost, sale) : null
  const marginPct = hasBothPrices ? calcMarginPct(cost, sale) : null

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setUploadPreview('')
    setImageTab('url')
    setPctField('')
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    const costStr = product.cost_price != null ? String(product.cost_price) : ''
    const priceStr = String(product.price)
    setForm({
      name: product.name,
      description: product.description,
      price: priceStr,
      cost_price: costStr,
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
    refreshPct(costStr, priceStr)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setUploadPreview('')
    setPctField('')
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
      setForm(prev => ({ ...prev, image_url: json.url! }))
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
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
    } catch { /* silently ignore */ }
    setProductToDelete(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.price || !form.color) {
      setFormError('Preencha os campos obrigatórios: nome, preço de venda e cor.')
      return
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
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
        setProducts(prev => prev.map(p => p.id === editing.id ? res.data : p))
      } else {
        const res = await createProduct(payload)
        setProducts(prev => [res.data, ...prev])
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
          <Plus size={16} /> Novo Produto
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
                <th>Custo</th>
                <th>Venda</th>
                <th>Margem</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton columns={9} /> : products.map((product) => {
                const hasCost = product.cost_price != null && product.cost_price > 0
                const mgn = hasCost ? calcMarginPct(product.cost_price!, product.price) : null
                return (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productCell}>
                        {product.image_url
                          ? <img src={assetUrl(product.image_url)} alt={product.name} className={styles.thumbnail} />
                          : <div className={styles.thumbnailPlaceholder} />}
                        <span className={styles.productName}>{product.name}</span>
                      </div>
                    </td>
                    <td>{product.category ?? 'iPhones'}</td>
                    <td>{product.storage}</td>
                    <td className={styles.costCell}>
                      {hasCost ? formatCurrency(product.cost_price!) : <span className={styles.noCost}>—</span>}
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      {mgn !== null ? (
                        <span className={`${styles.marginBadge} ${mgn >= 20 ? styles.marginGood : mgn >= 10 ? styles.marginOk : styles.marginLow}`}>
                          {mgn.toFixed(1)}%
                        </span>
                      ) : <span className={styles.noCost}>—</span>}
                    </td>
                    <td>{product.stock}</td>
                    <td>
                      <Badge variant={product.active ? 'success' : 'default'}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn} onClick={() => openEdit(product)} title="Editar"><Edit2 size={15} /></button>
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(product)} title="Excluir"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && products.length === 0 && (
                <tr><td colSpan={9} className={styles.emptyRow}>Nenhum produto cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className={styles.modal} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="Fechar"><X size={18} /></button>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>

                {/* Nome */}
                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Nome *</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: iPhone 15 Pro" required />
                </div>

                {/* Descrição */}
                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Descrição</label>
                  <textarea className={styles.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição do produto..." rows={3} />
                </div>

                {/* ── Seção de Precificação ── */}
                <div className={styles.formGridFull}>
                  <div className={styles.priceSection}>
                    <div className={styles.priceSectionHeader}>
                      <TrendingUp size={14} />

                      <span>Precificação</span>
                    </div>

                    {/* Linha 1: Custo | Venda */}
                    <div className={styles.priceRow}>
                      <div className={styles.priceField}>
                        <label className={styles.fieldLabel}>Preço de Custo (R$)</label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={form.cost_price}
                          onChange={e => handleCostChange(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div className={styles.priceField}>
                        <label className={styles.fieldLabel}>Preço de Venda (R$) *</label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={form.price}
                          onChange={e => handleSaleChange(e.target.value)}
                          placeholder="0,00"
                          required
                        />
                      </div>
                    </div>

                    {/* Linha 2: % de lucro sobre o custo */}
                    <div className={styles.calcBar}>
                      <span className={styles.calcLabel}>Lucro sobre o custo:</span>
                      <div className={styles.calcInputWrapper}>
                        <input
                          type="number" step="0.01" min="0"
                          className={styles.calcInput}
                          value={pctField}
                          onChange={e => handlePctChange(e.target.value)}
                          placeholder="0,00"
                        />
                        <span className={styles.calcInputSuffix}>%</span>
                      </div>
                      <span className={styles.calcHint}>→ calcula o preço de venda automaticamente</span>
                    </div>

                    {/* Card resumo */}
                    {hasBothPrices && profit !== null && markupPct !== null && marginPct !== null && (
                      <div className={styles.marginSummary}>
                        <div className={styles.marginSummaryItem}>
                          <span className={styles.marginSummaryLabel}>Lucro</span>
                          <span className={`${styles.marginSummaryValue} ${profit >= 0 ? styles.colorProfit : styles.colorLoss}`}>
                            {formatCurrency(profit)}
                          </span>
                        </div>
                        <div className={styles.marginSummaryDivider} />
                        <div className={styles.marginSummaryItem}>
                          <span className={styles.marginSummaryLabel}>% sobre custo</span>
                          <span className={`${styles.marginSummaryValue} ${markupPct >= 20 ? styles.colorGood : markupPct >= 10 ? styles.colorOk : styles.colorWarn}`}>
                            {markupPct.toFixed(2)}%
                          </span>
                        </div>
                        <div className={styles.marginSummaryDivider} />
                        <div className={styles.marginSummaryItem}>
                          <span className={styles.marginSummaryLabel}>% sobre venda</span>
                          <span className={styles.marginSummaryValue}>
                            {marginPct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estoque */}
                <div>
                  <label className={styles.fieldLabel}>Estoque</label>
                  <Input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>

                {/* Armazenamento */}
                <div>
                  <label className={styles.fieldLabel}>Armazenamento</label>
                  <Input value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} placeholder="Ex: 256GB" />
                </div>

                {/* Cor */}
                <div>
                  <label className={styles.fieldLabel}>Cor *</label>
                  <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Ex: Preto Natural" required />
                </div>

                {/* Imagem */}
                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Imagem do produto</label>
                  <div className={styles.imageTabs}>
                    <button type="button" className={`${styles.imageTab} ${imageTab === 'url' ? styles.imageTabActive : ''}`} onClick={() => setImageTab('url')}>
                      <Link size={14} /> URL
                    </button>
                    <button type="button" className={`${styles.imageTab} ${imageTab === 'upload' ? styles.imageTabActive : ''}`} onClick={() => setImageTab('upload')}>
                      <Upload size={14} /> Enviar do computador
                    </button>
                  </div>

                  {imageTab === 'url' ? (
                    <Input value={form.image_url} onChange={e => { setForm({ ...form, image_url: e.target.value }); setUploadPreview(e.target.value) }} placeholder="https://..." />
                  ) : (
                    <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
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
                  <input ref={fileInputRef} type="file" accept="image/*" className={styles.fileInputHidden} onChange={handleFileChange} />

                  {(uploadPreview || form.image_url) && (
                    <div className={styles.previewRow}>
                      <img src={uploadPreview || form.image_url} alt="Preview" className={styles.previewThumb} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <span className={styles.previewLabel}>Preview</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className={styles.fieldLabel}>Status</label>
                  <select className={styles.select} value={form.active} onChange={e => setForm({ ...form, active: Number(e.target.value) })}>
                    <option value={1}>Ativo</option>
                    <option value={0}>Inativo</option>
                  </select>
                </div>

                {/* Visibilidade */}
                <div>
                  <label className={styles.fieldLabel}>Visibilidade</label>
                  <select className={styles.select} value={form.is_vip} onChange={e => setForm({ ...form, is_vip: Number(e.target.value) })}>
                    <option value={0}>Público</option>
                    <option value={1}>Somente VIP</option>
                  </select>
                </div>

                {/* Categoria */}
                <div className={styles.formGridFull}>
                  <label className={styles.fieldLabel}>Categoria</label>
                  <select className={styles.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar produto'}</Button>
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
