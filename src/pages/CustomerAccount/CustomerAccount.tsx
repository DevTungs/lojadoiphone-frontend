import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Package, LogOut, CheckCircle, Clock, AlertCircle, Home, User, Mail, Phone, Edit2, MessageCircle, QrCode, Loader2 } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { formatCurrency } from '../../utils/formatters'
import { buildApiUrl, generateOrderPixPayment } from '../../services/api'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/atoms/Button/Button'
import Input from '../../components/atoms/Input/Input'
import PixPaymentModal from '../../components/organisms/PixPaymentModal/PixPaymentModal'
import Toast from '../../components/atoms/Toast/Toast'
import styles from './CustomerAccount.module.css'

interface OrderItem {
  product_name: string
  quantity: number
  price: number
}

interface ActivePayment {
  qr_code: string
  payment_string: string
  external_id: string | null
  expires_at: string | null
  amount: number
}

interface Order {
  id: number
  status: number
  total_price: number
  created_at: string
  seller_name: string
  items: OrderItem[]
  verification_word?: string
  active_payment?: ActivePayment | null
}

interface CustomerProfile {
  id: number
  name: string
  phone: string
  email: string
  notes?: string
  is_vip?: number
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

function isDeliveryVerificationEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1

  const normalized = String(value ?? '').trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false

  return true
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Cancelado',
  1: 'Pedido Realizado',
  2: 'Aguardando recibo PIX',
  3: 'Pagamento Confirmado',
  4: 'Aguardando Coleta',
  5: 'Finalizado',
}

const STATUS_COLORS: Record<number, string> = {
  0: styles.statusPending,
  1: styles.statusPending,
  2: styles.statusPaid,
  3: styles.statusProcessing,
  4: styles.statusProcessing,
  5: styles.statusDone,
}

function formatDate(str: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

export default function CustomerAccount() {
  const { token, isLoggedIn, isLoading, logout } = useCustomerAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pendingPixOrderId = (location.state as { pendingPixOrderId?: number } | null)?.pendingPixOrderId ?? null
  const autoPixTriggered = useRef(false)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ name: '', email: '', phone: '' })
  const [whatsapp, setWhatsapp] = useState('')
  const [deliveryVerificationEnabled, setDeliveryVerificationEnabled] = useState(true)
  const [pixLoadingOrderId, setPixLoadingOrderId] = useState<number | null>(null)
  const [pixModalData, setPixModalData] = useState<PixModalState | null>(null)
  const { toasts, addToast, removeToast } = useToast()

  async function loadCustomerOrders() {
    const response = await fetch(buildApiUrl('/customers/me/orders'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    setOrders(data || [])
    return data || []
  }

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    Promise.all([
      fetch(buildApiUrl('/customers/me'), {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      loadCustomerOrders(),
      fetch(buildApiUrl('/settings')).then((r) => r.json()),
    ])
      .then(([customerData, ordersData, settingsData]) => {
        setCustomer(customerData)
        setEditData({ name: customerData.name, email: customerData.email || '', phone: customerData.phone })
        setOrders(ordersData || [])
        const whatsappNumber = settingsData?.whatsapp || ''
        setWhatsapp(whatsappNumber)
        setDeliveryVerificationEnabled(isDeliveryVerificationEnabled(settingsData?.enable_delivery_verification))
        console.log('Settings carregadas:', { whatsapp: whatsappNumber, settings: settingsData })
      })
      .catch(() => {
        setOrders([])
      })
      .finally(() => setLoading(false))
  }, [isLoading, isLoggedIn, token, navigate])

  // Auto-generate PIX when arriving from checkout with a pending order
  useEffect(() => {
    if (loading || autoPixTriggered.current || !pendingPixOrderId) return
    const target = orders.find((o) => o.id === pendingPixOrderId)
    if (!target) return
    autoPixTriggered.current = true
    // Clear location state so F5 doesn't re-trigger the modal
    window.history.replaceState({}, '')
    setExpanded(pendingPixOrderId)
    handlePixPayment(target)
  }, [loading, orders, pendingPixOrderId])

  // Auto-open modal if an order already has an active valid PIX payment (e.g. after logout/login)
  useEffect(() => {
    if (loading || autoPixTriggered.current || pendingPixOrderId) return
    const withActivePix = orders.find(
      (o) => o.active_payment && o.active_payment.qr_code && o.active_payment.payment_string
    )
    if (!withActivePix || !withActivePix.active_payment) return
    autoPixTriggered.current = true
    const p = withActivePix.active_payment
    setExpanded(withActivePix.id)
    setPixModalData({
      orderId: withActivePix.id,
      amount: p.amount || withActivePix.total_price,
      qrCode: p.qr_code,
      paymentString: p.payment_string,
      externalId: p.external_id ?? '',
      expirationDate: p.expires_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
  }, [loading, orders, pendingPixOrderId])

  function handleLogout() {
    logout()
    navigate('/')
  }

  function toggleEditMode() {
    if (editMode && customer) {
      setEditData({ name: customer.name, email: customer.email || '', phone: customer.phone })
    }
    setEditMode(!editMode)
  }

  function handleContactFinance(order: Order) {
    if (!whatsapp) return
    const phone = whatsapp.replace(/\D/g, '')
    const message = [
      `Olá! Acabei de realizar o pagamento via PIX e vou enviar o comprovante do meu pedido.`,
      ``,
      `*Pedido #${order.id}*`,
      `*Valor total:* ${formatCurrency(order.total_price)}`,
      `*Data do pedido:* ${new Intl.DateTimeFormat('pt-BR').format(new Date(order.created_at))}`,
      ``,
      `Meu nome: ${customer?.name}`,
      `Meu telefone: ${customer?.phone}`,
    ].join('\n')

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  async function handlePixPayment(order: Order) {
    setPixLoadingOrderId(order.id)
    try {
      const res = await generateOrderPixPayment(order.id)
      const parsed = normalizePixPayment(res.data.payment)
      if (!parsed) {
        addToast('error', 'Não foi possível montar o QR Code PIX para este pedido.', 7000)
        return
      }
      setPixModalData({ ...parsed, orderId: order.id, amount: parsed.amount || order.total_price })
    } catch (error) {
      console.error('[CustomerAccount] Falha ao gerar PIX', error)
      addToast('error', 'Não foi possível gerar a cobrança PIX agora. Tente novamente em instantes.', 7000)
    } finally {
      setPixLoadingOrderId(null)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Olá, {customer?.name?.split(' ')[0]} 👋</h1>
            <p className={styles.subtitle}>Acompanhe o status dos seus pedidos</p>
          </div>
          <div className={styles.headerButtons}>
            <button className={styles.homeBtn} onClick={() => navigate('/')} title="Voltar ao site">
              <Home size={16} />
              Voltar ao site
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Sair da conta">
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Carregando dados...</p>
          </div>
        ) : (
          <>
            <div className={styles.profileSection}>
              <div className={styles.profileHeader}>
                <div className={styles.profileIcon}>
                  <User size={24} />
                </div>
                <div className={styles.profileInfo}>
                  <h2 className={styles.profileTitle}>Minha Conta</h2>
                  <p className={styles.profileSubtitle}>Informações pessoais</p>
                </div>
                <button className={styles.editToggleBtn} onClick={toggleEditMode} title={editMode ? 'Cancelar' : 'Editar'}>
                  <Edit2 size={16} />
                  {editMode ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {!editMode ? (
                <div className={styles.profileDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <User size={14} /> Nome
                    </span>
                    <span className={styles.detailValue}>{customer?.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Phone size={14} /> Telefone
                    </span>
                    <span className={styles.detailValue}>{customer?.phone}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Mail size={14} /> E-mail
                    </span>
                    <span className={styles.detailValue}>{customer?.email || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.profileForm}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Nome</label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Telefone</label>
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="+55 11 99999-9999"
                      type="tel"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>E-mail</label>
                    <Input
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      placeholder="seu@email.com"
                      type="email"
                    />
                  </div>
                  <div className={styles.formActions}>
                    <Button variant="secondary" onClick={toggleEditMode}>Cancelar</Button>
                    <Button onClick={() => { addToast('error', 'Edição de perfil em desenvolvimento.', 7000); toggleEditMode() }}>
                      Salvar alterações
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <h2 className={styles.ordersTitle}>Meus Pedidos</h2>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={48} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Nenhum pedido encontrado</p>
                <p className={styles.emptyText}>Seus pedidos aparecerão aqui após a compra.</p>
              </div>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <button
                      className={styles.orderHeader}
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <div className={styles.orderMeta}>
                        <span className={styles.orderId}>Pedido #{order.id}</span>
                        <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                      </div>
                      <div className={styles.orderRight}>
                        <span className={`${styles.statusBadge} ${STATUS_COLORS[order.status] ?? styles.statusPending}`}>
                          {order.status === 5 ? <CheckCircle size={12} /> : order.status >= 2 ? <Clock size={12} /> : <AlertCircle size={12} />}
                          {STATUS_LABELS[order.status] ?? 'Em andamento'}
                        </span>
                        <span className={styles.orderTotal}>{formatCurrency(order.total_price)}</span>
                      </div>
                    </button>

                    {expanded === order.id && (
                      <div className={styles.orderBody}>
                        <div className={styles.itemsList}>
                          {order.items.map((item, i) => (
                            <div key={i} className={styles.item}>
                              <span className={styles.itemName}>
                                {item.product_name}
                                {item.quantity > 1 && <span className={styles.itemQty}> x{item.quantity}</span>}
                              </span>
                              <span className={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className={styles.orderFooter}>
                          <div className={styles.orderFooterTop}>
                            {order.seller_name && (
                              <span className={styles.sellerName}>Vendedor: {order.seller_name}</span>
                            )}
                            <span className={styles.totalLine}>Total: <strong>{formatCurrency(order.total_price)}</strong></span>
                          </div>
                          {deliveryVerificationEnabled && order.verification_word && (
                            <div className={styles.verificationBox}>
                              <p className={styles.verificationBoxLabel}>Palavra de verificação na entrega</p>
                              <p className={styles.verificationBoxWord}>{order.verification_word}</p>
                              <p className={styles.verificationBoxHint}>Apresente esta palavra ao vendedor no momento da entrega.</p>
                            </div>
                          )}
                          {(isAwaitingPayment(order.status) || (order.status === 2 && whatsapp)) && (
                            <div className={styles.paymentActions}>
                              {isAwaitingPayment(order.status) && (
                                <button
                                  className={styles.pixPayBtn}
                                  onClick={() => handlePixPayment(order)}
                                  title="Gerar ou reabrir cobrança PIX"
                                  disabled={pixLoadingOrderId === order.id}
                                >
                                  {pixLoadingOrderId === order.id ? <Loader2 size={14} className={styles.spinIcon} /> : <QrCode size={14} />}
                                  {pixLoadingOrderId === order.id ? 'Gerando PIX...' : order.status === 2 ? 'Ver PIX novamente' : 'Pagar via PIX'}
                                </button>
                              )}
                              {order.status === 2 && whatsapp && (
                                <button
                                  className={styles.contactFinanceBtn}
                                  onClick={() => handleContactFinance(order)}
                                  title="Enviar comprovante pelo WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                  Enviar comprovante pelo WhatsApp
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
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
            setPixModalData(null)
          }}
          onExpired={() => {
            setPixModalData(null)
            void loadCustomerOrders().catch(() => null)
            addToast('error', 'O QR Code PIX expirou. O pedido foi cancelado.', 7000)
          }}
          cancelLabel="Fechar por agora"
          closeLabel="Continuar vendo o PIX"
        />
      )}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  )
}
