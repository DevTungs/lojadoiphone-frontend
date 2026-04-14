import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import type { Product, StoreSettings } from '../../types/index';
import { PRODUCT_CATEGORIES } from '../../types/index';
import { getProducts, getSettings } from '../../services/api';
import { useCart } from '../../contexts/CartContext';

import MainLayout from '../../components/templates/MainLayout/MainLayout';
import ProductGrid from '../../components/organisms/ProductGrid/ProductGrid';
import CartDrawer from '../../components/organisms/CartDrawer/CartDrawer';

import styles from './Products.module.css';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [activeCategory, setActiveCategory] = useState<string>(
    searchParams.get('categoria') ?? 'Todos'
  );

  useEffect(() => {
    Promise.all([getProducts(), getSettings()])
      .then(([productsRes, settingsRes]) => {
        setProducts(productsRes.data);
        setSettings(settingsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((p) => activeCategory === 'Todos' || (p.category ?? 'iPhones') === activeCategory)
    .sort((a, b) => {
      if (sort === 'asc') return a.price - b.price;
      if (sort === 'desc') return b.price - a.price;
      return 0;
    });

  const handleAddToCart = (product: Product, quantity = 1) => { addItem(product, quantity); };
  const handleBuy = (product: Product, quantity = 1) => { addItem(product, quantity); setIsCartOpen(true); };

  return (
    <MainLayout settings={settings} onCartClick={() => setIsCartOpen(true)}>
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

        <div className={styles.categoryTabs}>
          {['Todos', ...PRODUCT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${activeCategory === cat ? styles.categoryTabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <ProductGrid
        products={filtered}
        loading={loading}
        onAddToCart={handleAddToCart}
        onBuy={handleBuy}
        title="Todos os Produtos"
        sortNode={
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'default' | 'asc' | 'desc')}
            aria-label="Ordenar por preço"
          >
            <option value="default">Ordenar por</option>
            <option value="asc">Menor preço</option>
            <option value="desc">Maior preço</option>
          </select>
        }
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onFinalize={() => setIsCartOpen(false)}
        onLoginRequired={() => navigate('/login')}
      />
    </MainLayout>
  );
};

export default Products;
