import { useEffect, useState, useMemo } from 'react'
import { ShoppingCart, Package, TrendingUp, Users, Calendar, Filter } from 'lucide-react'
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout'
import SellerRanking from '../../../components/organisms/SellerRanking/SellerRanking'
import Spinner from '../../../components/atoms/Spinner/Spinner'
import { getStats, getSellersRanking, getOrders, getOrder, getDashboardStats, getSellerPerformance, getProductPerformance } from '../../../services/api'
import { formatCurrency } from '../../../utils/formatters'
import type { Stats, Seller, Order } from '../../../types/index'
import styles from './Dashboard.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'all'

interface SellerPerf {
  seller_id: number
  seller_name: string
  orders: number
  total: number
}

interface ProductPerf {
  product_id: number
  product_name: string
  quantity: number
  total: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// (Removed: period filtering moved to backend)

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState<{ totalOrders: number; totalSales: number; totalProducts: number } | null>(null)
  const [sellerPerf, setSellerPerf] = useState<SellerPerf[]>([])
  const [productPerf, setProductPerf] = useState<ProductPerf[]>([])
  const [allSellers, setAllSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [period, setPeriod] = useState<Period>('month')
  const [selectedSellers, setSelectedSellers] = useState<number[]>([]) // empty = all

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, perfRes, prodRes, sellersRes] = await Promise.all([
          getDashboardStats(period),
          getSellerPerformance(period),
          getProductPerformance(period),
          getSellersRanking(),
        ])
        setDashboardStats(dashRes.data)
        setSellerPerf(perfRes.data)
        setProductPerf(prodRes.data)
        setAllSellers(sellersRes.data)
      } catch {
        setError('Erro ao carregar dados do dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  // ─── Derived data (filtering only) ────────────────────────────────────────────

  // Seller list for chips (from allSellers)
  const sellerList = useMemo((): Seller[] => {
    return allSellers
  }, [allSellers])

  // Filtered seller perf by selected sellers
  const visibleSellerPerf = useMemo((): SellerPerf[] => {
    if (selectedSellers.length === 0) return sellerPerf
    return sellerPerf.filter((sp) => selectedSellers.includes(sp.seller_id))
  }, [sellerPerf, selectedSellers])

  const sellerPerfTotals = useMemo(
    () => ({
      orders: visibleSellerPerf.reduce((s, sp) => s + sp.orders, 0),
      total: visibleSellerPerf.reduce((s, sp) => s + sp.total, 0),
    }),
    [visibleSellerPerf]
  )

  // Sellers for ranking: use API data + allSellers info
  const rankingSellers = useMemo((): Seller[] => {
    const map = new Map<number, number>()
    for (const sp of sellerPerf) {
      map.set(sp.seller_id, sp.orders)
    }
    return allSellers
      .map((s) => ({ ...s, sales_count: map.get(s.id) ?? 0 }))
      .filter((s) => s.sales_count > 0)
      .sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0))
  }, [sellerPerf, allSellers])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function toggleSeller(id: number) {
    setSelectedSellers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function selectAllSellers() {
    setSelectedSellers([])
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className={styles.center}>
          <Spinner />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className={styles.center}>
          <p className={styles.error}>{error}</p>
        </div>
      </AdminLayout>
    )
  }

  const periodLabels: Record<Period, string> = {
    today: 'Hoje',
    week: 'Esta semana',
    month: 'Este mês',
    all: 'Tudo',
  }

  return (
    <AdminLayout title="Dashboard">

      {/* ── Filtro de período ── */}
      <div className={styles.periodBar}>
        <Calendar size={16} className={styles.periodIcon} />
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button
            key={p}
            className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* ── Cards de estatísticas ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(25,198,163,0.12)' }}>
            <ShoppingCart size={22} color="#19c6a3" />
          </div>
          <div>
            <div className={styles.statValue}>{dashboardStats?.totalOrders ?? 0}</div>
            <div className={styles.statLabel}>Total de Pedidos</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Package size={22} color="#3b82f6" />
          </div>
          <div>
            <div className={styles.statValue}>{dashboardStats?.totalProducts ?? 0}</div>
            <div className={styles.statLabel}>Total de Produtos</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(34,197,94,0.12)' }}>
            <TrendingUp size={22} color="#22c55e" />
          </div>
          <div>
            <div className={styles.statValue}>{formatCurrency(dashboardStats?.totalSales ?? 0)}</div>
            <div className={styles.statLabel}>Total em Vendas</div>
          </div>
        </div>
      </div>

      {/* ── Desempenho por vendedor ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Users size={18} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Desempenho por Vendedor</h2>
        </div>

        {/* Chips de vendedor */}
        {sellerList.length > 0 && (
          <div className={styles.sellerChips}>
            <button
              className={`${styles.chip} ${selectedSellers.length === 0 ? styles.chipActive : ''}`}
              onClick={selectAllSellers}
            >
              Todos
            </button>
            {sellerList.map((s) => (
              <button
                key={s.id}
                className={`${styles.chip} ${selectedSellers.includes(s.id) ? styles.chipActive : ''}`}
                onClick={() => toggleSeller(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {visibleSellerPerf.length === 0 ? (
          <p className={styles.noData}>Nenhum dado para o período selecionado.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Pedidos</th>
                  <th>Total em Vendas</th>
                </tr>
              </thead>
              <tbody>
                {visibleSellerPerf.map((sp) => (
                  <tr key={sp.seller_id}>
                    <td>{sp.seller_name}</td>
                    <td>{sp.orders}</td>
                    <td>{formatCurrency(sp.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td>{sellerPerfTotals.orders}</td>
                  <td>{formatCurrency(sellerPerfTotals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Ranking visual ── */}
      {rankingSellers.length > 0 && (
        <div className={styles.section}>
          <SellerRanking sellers={rankingSellers} />
        </div>
      )}

      {/* ── Aparelhos mais vendidos ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Filter size={18} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Aparelhos mais vendidos</h2>
        </div>

        {loading ? (
          <div className={styles.center}>
            <Spinner />
          </div>
        ) : productPerf.length === 0 ? (
          <p className={styles.noData}>Nenhum dado de produto disponível para o período.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd vendida</th>
                  <th>Total em Vendas</th>
                </tr>
              </thead>
              <tbody>
                {productPerf.map((pp) => (
                  <tr key={pp.product_id}>
                    <td>{pp.product_name}</td>
                    <td>{pp.quantity}</td>
                    <td>{formatCurrency(pp.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td>{productPerf.reduce((s, p) => s + p.quantity, 0)}</td>
                  <td>{formatCurrency(productPerf.reduce((s, p) => s + p.total, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </AdminLayout>
  )
}
