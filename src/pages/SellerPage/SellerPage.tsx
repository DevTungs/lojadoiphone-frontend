import React, { useEffect, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { Product, Seller, StoreSettings } from '../../types/index'
import { getProducts, getSettings, getSellerBySlug } from '../../services/api'
import { assetUrl } from '../../utils/assetUrl'
import { useCart } from '../../contexts/CartContext'
import MainLayout from '../../components/templates/MainLayout/MainLayout'
import HeroSection from '../../components/organisms/HeroSection/HeroSection'
import ProductGrid from '../../components/organisms/ProductGrid/ProductGrid'
import FeaturesSection from '../../components/organisms/FeaturesSection/FeaturesSection'
import CartDrawer from '../../components/organisms/CartDrawer/CartDrawer'
import styles from './SellerPage.module.css'

const SellerPage: React.FC = () => {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { addItem } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [seller, setSeller] = useState<Seller | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!slug) return
    Promise.all([
      getProducts(),
      getSettings(),
      getSellerBySlug(slug),
    ])
      .then(([productsRes, settingsRes, sellerRes]) => {
        setProducts(productsRes.data)
        setSettings(settingsRes.data)
        setSeller(sellerRes.data)
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (notFound) return <Navigate to="/" replace />

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout settings={settings} onCartClick={() => setIsCartOpen(true)}>
      <section id="inicio">
        <HeroSection logoUrl={settings?.logo_url} storeName={settings?.store_name} />
      </section>

      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <Search size={18} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar produtos"
          />
        </div>
      </div>

      <section id="produtos">
        <ProductGrid
          products={filteredProducts}
          loading={loading}
          onAddToCart={(p, q = 1) => addItem(p, q)}
          onBuy={(p, q = 1) => { addItem(p, q); setIsCartOpen(true) }}
        />
      </section>

      <FeaturesSection />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onFinalize={() => setIsCartOpen(false)}
        onLoginRequired={() => navigate('/login')}
        preselectedSellerId={seller ? String(seller.id) : undefined}
        preselectedSellerName={seller?.name}
        lockSeller={!!seller}
        storeWhatsapp={settings?.whatsapp}
      />
    </MainLayout>
  )
}

export default SellerPage
