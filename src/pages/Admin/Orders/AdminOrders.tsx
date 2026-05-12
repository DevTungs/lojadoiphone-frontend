import { useEffect, useMemo, useState } from 'react'
import { X, Eye, History, Search, MessageCircle, QrCode, Loader2 } from 'lucide-react'
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout'
import Button from '../../../components/atoms/Button/Button'
import Spinner from '../../../components/atoms/Spinner/Spinner'
import TableSkeleton from '../../../components/atoms/TableSkeleton/TableSkeleton'
import Toast from '../../../components/atoms/Toast/Toast'
import { useToast } from '../../../hooks/useToast'
import { getOrders, getOrder, updateOrderStatus, generateOrderPixPayment, getSettings } from '../../../services/api'
import PixPaymentModal from '../../../components/organisms/PixPaymentModal/PixPaymentModal'
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '../../../utils/formatters'
import type { Order } from '../../../types/index'

interface StatusHistoryEntry {
  id: number
  old_status: number
  new_status: number
  admin_name: string
  created_at: string
}

interface PixModalState {
  orderId: number
  amount: number
  qrCode: string
  paymentString: string
  externalId: string
  expirationDate: string
}

function normalizePixPayment(raw: unknown): PixModalState | null {
  if (!raw || typeof raw !== 'object') return null
  const payment = raw as Record<string, unknown>

  const qrCode = typeof payment.qrCode === 'string' ? payment.qrCode : typeof payment.qr_code === 'string' ? payment.qr_code : ''
  const paymentString = typeof payment.paymentString === 'string'
    ? payment.paymentString
    : typeof payment.payment_string === 'string'
      ? payment.payment_string
      : ''

  if (!qrCode || !paymentString) return null

  const amountRaw = payment.amount
  const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw ?? 0)

  return {
    orderId: Number(payment.order_id ?? 0),
    amount: Number.isFinite(amount) ? amount : 0,
    qrCode,
    paymentString,
    externalId: String(payment.externalId ?? payment.external_id ?? ''),
    expirationDate: String(payment.expirationDate ?? payment.expires_at ?? new Date().toISOString()),
  }
}

function isAwaitingPayment(status: number): boolean {
  return status === 1 || status === 2
}

function formatPaidAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}
import styles from './AdminOrders.module.css'

const STATUS_OPTIONS = [0, 1, 2, 3, 4, 5] as const

function isDeliveryVerificationEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1

  const normalized = String(value ?? '').trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false

  return true
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [newStatus, setNewStatus] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [inlineSaving, setInlineSaving] = useState<number | null>(null)
  const [pixLoadingOrderId, setPixLoadingOrderId] = useState<number | null>(null)
  const [pixModalData, setPixModalData] = useState<PixModalState | null>(null)
  const [deliveryVerificationEnabled, setDeliveryVerificationEnabled] = useState(true)
  const { toasts, addToast, removeToast } = useToast()

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search.trim() ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search.trim()) ||
        o.phone.includes(search.trim())
      const orderDate = o.created_at ? o.created_at.slice(0, 10) : ''
      const matchFrom = !dateFrom || orderDate >= dateFrom
      const matchTo = !dateTo || orderDate <= dateTo
      const matchStatus = statusFilter === null || o.status === statusFilter
      return matchSearch && matchFrom && matchTo && matchStatus
    })
  }, [orders, search, dateFrom, dateTo, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const s of STATUS_OPTIONS) counts[s] = 0
    for (const o of orders) {
      if (counts[o.status] !== undefined) counts[o.status]++
    }
    return counts
  }, [orders])

  useEffect(() => {
    async function fetchOrders() {
      try {
        const [ordersRes, settingsRes] = await Promise.all([getOrders(), getSettings()])
        setOrders(ordersRes.data)
        setDeliveryVerificationEnabled(isDeliveryVerificationEnabled(settingsRes.data.enable_delivery_verification))
      } catch {
        setError('Erro ao carregar pedidos.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  async function openOrderDetail(order: Order) {
    setDetailLoading(true)
    try {
      const res = await getOrder(order.id)
      setSelectedOrder(res.data)
      setNewStatus(res.data.status)
    } catch {
      setSelectedOrder(order)
      setNewStatus(order.status)
    } finally {
      setDetailLoading(false)
    }
  }

  function closeModal() {
    setSelectedOrder(null)
  }

  async function handleSaveStatus() {
    if (!selectedOrder) return
    setSaving(true)
    try {
      await updateOrderStatus(selectedOrder.id, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
      )
      setSelectedOrder({ ...selectedOrder, status: newStatus })
      addToast('success', 'Status atualizado com sucesso!')
    } catch {
      addToast('error', 'Erro ao atualizar status.')
    } finally {
      setSaving(false)
    }
  }

  async function handleInlineStatus(orderId: number, newSt: number) {
    setInlineSaving(orderId)
    try {
      await updateOrderStatus(orderId, newSt)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newSt } : o))
      )
      addToast('success', 'Status atualizado!')
    } catch {
      addToast('error', 'Erro ao atualizar status.')
    } finally {
      setInlineSaving(null)
    }
  }

  function openWhatsApp(order: Order) {
    const statusLabel = getOrderStatusLabel(order.status)
    const text = encodeURIComponent(
      `Olá ${order.customer_name}, seu pedido #${order.id} está com o status: *${statusLabel}*. Qualquer dúvida, estamos à disposição!`
    )
    const phone = order.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  async function openPixPayment(order: Order) {
    setPixLoadingOrderId(order.id)
    try {
      const res = await generateOrderPixPayment(order.id)
      const parsed = normalizePixPayment(res.data.payment)
      if (!parsed) {
        addToast('error', 'Não foi possível montar o QR Code PIX deste pedido.')
        return
      }
      setPixModalData({ ...parsed, orderId: order.id, amount: parsed.amount || order.total_price })
      addToast('success', res.data.reused ? 'Cobrança PIX ativa encontrada.' : 'Cobrança PIX gerada com sucesso!')
    } catch {
      addToast('error', 'Falha ao gerar cobrança PIX para o pedido.')
    } finally {
      setPixLoadingOrderId(null)
    }
  }

  const hasFilters = !!(dateFrom || dateTo || search || statusFilter !== null)

  return (
    <AdminLayout title="Pedidos">
      {/* ─── Contadores por status ─── */}
      <div className={styles.statusCounters}>
        <button
          className={`${styles.counterChip} ${statusFilter === null ? styles.counterChipActive : ''}`}
          onClick={() => setStatusFilter(null)}
        >
          Todos <span className={styles.counterBadge}>{orders.length}</span>
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            className={`${styles.counterChip} ${statusFilter === s ? styles.counterChipActive : ''}`}
            style={statusFilter === s ? {
              borderColor: getOrderStatusColor(s),
              color: getOrderStatusColor(s),
              background: getOrderStatusColor(s) + '12',
            } : undefined}
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
          >
            <span
              className={styles.counterDot}
              style={{ background: getOrderStatusColor(s) }}
            />
            {getOrderStatusLabel(s)}
            <span className={styles.counterBadge}>{statusCounts[s]}</span>
          </button>
        ))}
      </div>

      {/* ─── Barra de filtros ─── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por nome, telefone ou nº do pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.dateFilters}>
          <label className={styles.dateLabel}>De</label>
          <input
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <label className={styles.dateLabel}>Até</label>
          <input
            type="date"
            className={styles.dateInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          {hasFilters && (
            <button
              className={styles.clearBtn}
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setStatusFilter(null) }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className={styles.center}><p className={styles.errorText}>{error}</p></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Vendedor</th>
                <th>Status</th>
                <th>Total</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeleton columns={8} /> : filtered.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderId}>#{order.id}</td>
                  <td className={styles.customerName}>{order.customer_name}</td>
                  <td>{order.phone}</td>
                  <td>{order.seller_name ?? '—'}</td>
                  <td>
                    <div className={styles.inlineStatusWrapper}>
                      {inlineSaving === order.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <select
                          className={styles.inlineStatusSelect}
                          value={order.status}
                          style={{
                            background: getOrderStatusColor(order.status) + '15',
                            color: getOrderStatusColor(order.status),
                            borderColor: getOrderStatusColor(order.status) + '60',
                          }}
                          onChange={(e) => handleInlineStatus(order.id, Number(e.target.value))}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td>{formatCurrency(order.total_price)}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openOrderDetail(order)}
                        title="Ver detalhes"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.whatsappBtn}`}
                        onClick={() => openWhatsApp(order)}
                        title="Notificar via WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </button>
                      {isAwaitingPayment(order.status) && (
                        <button
                          className={`${styles.iconBtn} ${styles.pixBtn}`}
                          onClick={() => openPixPayment(order)}
                          title="Gerar ou regerar PIX"
                          disabled={pixLoadingOrderId === order.id}
                        >
                          {pixLoadingOrderId === order.id ? <Loader2 size={15} className={styles.spinIcon} /> : <QrCode size={15} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    {orders.length === 0 ? 'Nenhum pedido encontrado.' : 'Nenhum pedido corresponde aos filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(selectedOrder || detailLoading) && (
        <div
          className={styles.modal}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedOrder ? `Pedido #${selectedOrder.id}` : 'Carregando...'}
              </h2>
              <div className={styles.modalHeaderActions}>
                {selectedOrder && (
                  isAwaitingPayment(selectedOrder.status) && (
                    <button
                      className={styles.pixModalBtn}
                      onClick={() => openPixPayment(selectedOrder)}
                      title="Gerar ou regerar PIX"
                      disabled={pixLoadingOrderId === selectedOrder.id}
                    >
                      {pixLoadingOrderId === selectedOrder.id ? <Loader2 size={16} className={styles.spinIcon} /> : <QrCode size={16} />}
                      {pixLoadingOrderId === selectedOrder.id ? 'Gerando PIX...' : 'Cobrança PIX'}
                    </button>
                  )
                )}
                {selectedOrder && (
                  <button
                    className={styles.whatsappModalBtn}
                    onClick={() => openWhatsApp(selectedOrder)}
                    title="Notificar via WhatsApp"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                )}
                <button className={styles.closeBtn} onClick={closeModal} aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className={styles.center}><Spinner /></div>
            ) : selectedOrder ? (
              <div className={styles.detailContent}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Cliente</span>
                    <span className={styles.detailValue}>{selectedOrder.customer_name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Telefone</span>
                    <span className={styles.detailValue}>{selectedOrder.phone}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vendedor</span>
                    <span className={styles.detailValue}>{selectedOrder.seller_name ?? '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Total</span>
                    <span className={styles.detailValue}>{formatCurrency(selectedOrder.total_price)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Data</span>
                    <span className={styles.detailValue}>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status atual</span>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: getOrderStatusColor(selectedOrder.status) + '20',
                        color: getOrderStatusColor(selectedOrder.status),
                      }}
                    >
                      {getOrderStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  {selectedOrder.payment?.status && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status pagamento</span>
                      <span className={styles.detailValue}>{selectedOrder.payment.status}</span>
                    </div>
                  )}
                  {selectedOrder.payment?.paid_at && (
                    <div className={`${styles.detailItem} ${styles.detailItemHighlight}`}>
                      <span className={styles.detailLabel}>Pagamento confirmado em</span>
                      <span className={styles.detailValueStrong}>{formatPaidAt(selectedOrder.payment.paid_at)}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_full_name && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Nome entrega</span>
                      <span className={styles.detailValue}>{selectedOrder.delivery_full_name}</span>
                    </div>
                  )}
                  {(selectedOrder.delivery_city || selectedOrder.delivery_state) && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Cidade / Estado</span>
                      <span className={styles.detailValue}>
                        {[selectedOrder.delivery_city, selectedOrder.delivery_state].filter(Boolean).join(' / ')}
                      </span>
                    </div>
                  )}
                  {selectedOrder.delivery_reference && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Referência</span>
                      <span className={styles.detailValue}>{selectedOrder.delivery_reference}</span>
                    </div>
                  )}
                </div>

                {(selectedOrder.checkout_phone || (deliveryVerificationEnabled && selectedOrder.verification_word)) && (
                  <div className={styles.verificationSection}>
                    <h3 className={styles.sectionTitle}>Verificação na Entrega</h3>
                    <div className={styles.verificationGrid}>
                      {selectedOrder.checkout_phone && (
                        <div className={styles.verificationItem}>
                          <span className={styles.verificationLabel}>Telefone (checkout)</span>
                          <span className={styles.verificationValue}>{selectedOrder.checkout_phone}</span>
                        </div>
                      )}
                      {deliveryVerificationEnabled && selectedOrder.verification_word && (
                        <div className={styles.verificationItem}>
                          <span className={styles.verificationLabel}>Palavra de verificação</span>
                          <span className={styles.verificationWord}>{selectedOrder.verification_word}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className={styles.itemsSection}>
                    <h3 className={styles.sectionTitle}>Itens do Pedido</h3>
                    <div className={styles.itemsList}>
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className={styles.orderItem}>
                          <span className={styles.itemName}>
                            {item.product_name ?? `Produto #${item.product_id}`}
                          </span>
                          <span className={styles.itemQty}>x{item.quantity}</span>
                          <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.statusSection}>
                  <h3 className={styles.sectionTitle}>Atualizar Status</h3>
                  <div className={styles.statusGrid}>
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.statusOption} ${newStatus === s ? styles.statusOptionSelected : ''}`}
                        style={newStatus === s ? {
                          background: getOrderStatusColor(s) + '18',
                          borderColor: getOrderStatusColor(s),
                          color: getOrderStatusColor(s),
                        } : undefined}
                        onClick={() => setNewStatus(s)}
                      >
                        <span className={styles.statusDot} style={{ background: getOrderStatusColor(s) }} />
                        {getOrderStatusLabel(s)}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleSaveStatus} disabled={saving || newStatus === selectedOrder.status} className={styles.saveStatusBtn}>
                    {saving ? 'Salvando...' : 'Salvar status'}
                  </Button>
                </div>

                {(selectedOrder as Order & { statusHistory?: StatusHistoryEntry[] }).statusHistory?.length ? (
                  <div className={styles.historySection}>
                    <h3 className={styles.sectionTitle}>
                      <History size={14} style={{ display: 'inline', marginRight: 6 }} />
                      Histórico de alterações
                    </h3>
                    <div className={styles.historyList}>
                      {(selectedOrder as Order & { statusHistory?: StatusHistoryEntry[] }).statusHistory!.map((entry) => (
                        <div key={entry.id} className={styles.historyItem}>
                          <div className={styles.historyInfo}>
                            <span className={styles.historyAdmin}>{entry.admin_name}</span>
                            <span className={styles.historyChange}>
                              <span className={styles.historyFrom}>{getOrderStatusLabel(entry.old_status)}</span>
                              {' → '}
                              <span className={styles.historyTo}>{getOrderStatusLabel(entry.new_status)}</span>
                            </span>
                          </div>
                          <span className={styles.historyDate}>{formatDate(entry.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
      {pixModalData && (
        <PixPaymentModal
          isOpen={Boolean(pixModalData)}
          orderId={pixModalData.orderId}
          amount={pixModalData.amount}
          qrCode={pixModalData.qrCode}
          paymentString={pixModalData.paymentString}
          externalId={pixModalData.externalId}
          expirationDate={pixModalData.expirationDate}
          onClose={() => setPixModalData(null)}
          onCancel={() => {
            const activeOrder = selectedOrder ?? orders.find((o) => o.id === pixModalData.orderId) ?? null
            setPixModalData(null)
            if (activeOrder) openWhatsApp(activeOrder)
          }}
        />
      )}
      <Toast toasts={toasts} onClose={removeToast} />
    </AdminLayout>
  )
}
