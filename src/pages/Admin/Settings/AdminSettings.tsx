import { useEffect, useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'
import { Save, CheckCircle, Upload, Link } from 'lucide-react'
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout'
import Button from '../../../components/atoms/Button/Button'
import Input from '../../../components/atoms/Input/Input'
import Spinner from '../../../components/atoms/Spinner/Spinner'
import { getSettings, updateSettings } from '../../../services/api'
import { assetUrl } from '../../../utils/assetUrl'
import type { StoreSettings } from '../../../types/index'
import styles from './AdminSettings.module.css'

type ImageField = 'logo_url' | 'favicon_url'

export default function AdminSettings() {
  const [form, setForm] = useState<StoreSettings>({
    store_name: '',
    logo_url: '',
    favicon_url: '',
    whatsapp: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [logoTab, setLogoTab] = useState<'url' | 'upload'>('url')
  const [faviconTab, setFaviconTab] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState<ImageField | null>(null)
  const logoFileRef = useRef<HTMLInputElement | null>(null)
  const faviconFileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    getSettings()
      .then((res) => setForm({ ...res.data, favicon_url: res.data.favicon_url ?? '' }))
      .catch(() => setError('Erro ao carregar configurações.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(file: File, field: ImageField) {
    const token = localStorage.getItem('auth_token')
    const data = new FormData()
    data.append('image', file)
    setUploading(field)
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })
      const text = await res.text()
      let json: { url?: string; error?: string } = {}
      try { json = JSON.parse(text) } catch { /* response wasn't JSON */ }
      if (!res.ok) throw new Error(json.error ?? `Erro no upload (${res.status})`)
      if (!json.url) throw new Error('Servidor não retornou URL da imagem')
      setForm((prev) => ({ ...prev, [field]: json.url! }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setUploading(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      await updateSettings(form)
      if (form.store_name) document.title = form.store_name
      const favicon = document.getElementById('favicon') as HTMLLinkElement | null
      if (favicon && form.favicon_url) favicon.href = assetUrl(form.favicon_url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erro ao salvar configurações. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Configurações">
        <div className={styles.center}><Spinner /></div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Configurações">
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Configurações da Loja</h2>
            <p className={styles.cardSubtitle}>Personalize as informações exibidas na sua loja.</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}
          {success && (
            <div className={styles.successBanner}>
              <CheckCircle size={16} />
              Configurações salvas com sucesso!
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>

            {/* Nome da loja */}
            <div className={styles.field}>
              <label className={styles.label}>Nome da Loja</label>
              <Input
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                placeholder="Ex: Loja do iPhone"
              />
              <p className={styles.hint}>Aparece na aba do navegador</p>
            </div>

            {/* WhatsApp */}
            <div className={styles.field}>
              <label className={styles.label}>WhatsApp</label>
              <Input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+55 11 99999-9999"
                type="tel"
              />
              <p className={styles.hint}>Com código do país (ex: +55 para Brasil, +595 para Paraguai)</p>
            </div>

            {/* Logo da loja */}
            <div className={styles.field}>
              <label className={styles.label}>Logo da loja</label>
              <p className={styles.hint} style={{ marginBottom: 8 }}>Imagem exibida no cabeçalho da loja</p>
              <ImageUploadField
                tab={logoTab}
                onTabChange={setLogoTab}
                value={form.logo_url}
                onUrlChange={(v) => setForm({ ...form, logo_url: v })}
                onFileChange={(f) => handleUpload(f, 'logo_url')}
                uploading={uploading === 'logo_url'}
                fileRef={logoFileRef}
                previewRound={false}
              />
            </div>

            {/* Ícone da aba */}
            <div className={styles.field}>
              <label className={styles.label}>Ícone da aba (favicon)</label>
              <p className={styles.hint} style={{ marginBottom: 8 }}>Ícone pequeno exibido na aba do navegador. Recomendado: PNG ou SVG quadrado (ex: 32×32px)</p>
              <ImageUploadField
                tab={faviconTab}
                onTabChange={setFaviconTab}
                value={form.favicon_url}
                onUrlChange={(v) => setForm({ ...form, favicon_url: v })}
                onFileChange={(f) => handleUpload(f, 'favicon_url')}
                uploading={uploading === 'favicon_url'}
                fileRef={faviconFileRef}
                previewRound={false}
                previewSize={48}
              />
            </div>

            <div className={styles.footer}>
              <Button type="submit" disabled={saving} className={styles.saveBtn}>
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}

// ─── Subcomponente reutilizável ───────────────────────────────────────────────

interface ImageUploadFieldProps {
  tab: 'url' | 'upload'
  onTabChange: (t: 'url' | 'upload') => void
  value: string
  onUrlChange: (v: string) => void
  onFileChange: (f: File) => void
  uploading: boolean
  fileRef: RefObject<HTMLInputElement | null>
  previewRound?: boolean
  previewSize?: number
}

function ImageUploadField({
  tab, onTabChange, value, onUrlChange, onFileChange,
  uploading, fileRef, previewRound = false, previewSize = 80,
}: ImageUploadFieldProps) {
  return (
    <>
      <div className={styles.imageTabs}>
        <button
          type="button"
          className={`${styles.imageTab} ${tab === 'url' ? styles.imageTabActive : ''}`}
          onClick={() => onTabChange('url')}
        >
          <Link size={14} /> URL
        </button>
        <button
          type="button"
          className={`${styles.imageTab} ${tab === 'upload' ? styles.imageTabActive : ''}`}
          onClick={() => onTabChange('upload')}
        >
          <Upload size={14} /> Enviar do computador
        </button>
      </div>

      {tab === 'url' ? (
        <Input
          value={value}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
        />
      ) : (
        <div className={styles.uploadArea} onClick={() => fileRef.current?.click()}>
          {uploading ? (
            <div className={styles.uploadLoading}><Spinner size="sm" /><span>Enviando...</span></div>
          ) : (
            <>
              <Upload size={24} className={styles.uploadIcon} />
              <span className={styles.uploadText}>Clique para selecionar</span>
              <span className={styles.uploadHintSm}>JPG, PNG, SVG, ICO até 10MB</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.ico,.svg"
        className={styles.fileInputHidden}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f) }}
      />

      {value && (
        <div className={styles.logoPreview}>
          <p className={styles.previewLabel}>Preview</p>
          <div className={styles.previewBox} style={{ width: previewSize * 1.5, height: previewSize }}>
            <img
              src={value}
              alt="Preview"
              className={styles.previewImg}
              style={{ borderRadius: previewRound ? '50%' : undefined }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        </div>
      )}
    </>
  )
}
