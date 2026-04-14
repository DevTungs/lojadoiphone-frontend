import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, LogOut, CheckCircle, Clock, AlertCircle, Home, User, Mail, Phone, Edit2, MessageCircle } from 'lucide-react'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { formatCurrency } from '../../utils/formatters'
import { buildApiUrl } from '../../services/api'
import Button from '../../components/atoms/Button/Button'
import Input from '../../components/atoms/Input/Input'
import styles from './CustomerAccount.module.css'

interface OrderItem {
  product_name: string
  quantity: number
  price: number
}

interface Order {
  id: number
  status: number
  total_price: number
  created_at: string
  seller_name: string
  items: OrderItem[]
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

const STATUS_LABELS: Record<number, string> = {
  0: 'Pedido realizado',
  1: 'Aguardando pagamento',
  2: 'Pagamento confirmado',
  3: 'Em separação',
  4: 'Aguardando coleta',
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
  const { token, isLoggedIn, logout } = useCustomerAuth()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ name: '', email: '', phone: '' })
  const [whatsapp, setWhatsapp] = useState('')

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    Promise.all([
      fetch(buildApiUrl('/customers/me'), {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(buildApiUrl('/customers/me/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(buildApiUrl('/settings')).then((r) => r.json()),
    ])
      .then(([customerData, ordersData, settingsData]) => {
        setCustomer(customerData)
        setEditData({ name: customerData.name, email: customerData.email || '', phone: customerData.phone })
        setOrders(ordersData || [])
        const whatsappNumber = settingsData?.whatsapp || ''
        setWhatsapp(whatsappNumber)
        console.log('Settings carregadas:', { whatsapp: whatsappNumber, settings: settingsData })
      })
      .catch(() => {
        setOrders([])
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn, token, navigate])

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
      `Olá! Gostaria de efetuar o pagamento do meu pedido.`,
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
                    <Button onClick={() => { alert('Edição de perfil em desenvolvimento'); toggleEditMode() }}>
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
                          {whatsapp && (
                            <button
                              className={styles.contactFinanceBtn}
                              onClick={() => handleContactFinance(order)}
                              title="Entrar em contato para efetuar o pagamento"
                            >
                              <MessageCircle size={14} />
                              Pagar via WhatsApp
                            </button>
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
    </div>
  )
}
