import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import type { Product, StoreSettings, Promotion } from '../../types/index';
import { getProducts, getSettings, getPromotions } from '../../services/api';
import { useCart } from '../../contexts/CartContext';

import MainLayout from '../../components/templates/MainLayout/MainLayout';
import HeroSection from '../../components/organisms/HeroSection/HeroSection';
import SellerSection from '../../components/organisms/SellerSection/SellerSection';
import ProductGrid from '../../components/organisms/ProductGrid/ProductGrid';
import FeaturesSection from '../../components/organisms/FeaturesSection/FeaturesSection';
import CartDrawer from '../../components/organisms/CartDrawer/CartDrawer';
import Button from '../../components/atoms/Button/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, settingsRes, promotionsRes] = await Promise.all([
          getProducts(),
          getSettings(),
          getPromotions(),
        ]);
        setProducts(productsRes.data);
        setSettings(settingsRes.data);
        setPromotions(promotionsRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product, quantity = 1) => { addItem(product, quantity); setIsCartOpen(true); };
  const handleBuy = (product: Product, quantity = 1) => { addItem(product, quantity); setIsCartOpen(true); };

  return (
    <MainLayout settings={settings} onCartClick={() => setIsCartOpen(true)}>
      <section id="inicio">
        <HeroSection logoUrl={settings?.logo_url} storeName={settings?.store_name} promotions={promotions} />
      </section>

      <section id="produtos">
        <ProductGrid
          products={products}
          loading={loading}
          onAddToCart={handleAddToCart}
          onBuy={handleBuy}
          limit={6}
          footer={
            <Link to="/produtos">
              <Button variant="secondary" size="lg" rightIcon={<ChevronRight size={18} />}>
                Ver todos os produtos
              </Button>
            </Link>
          }
        />
      </section>

      <FeaturesSection />

      <SellerSection />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onFinalize={() => setIsCartOpen(false)}
        onLoginRequired={() => navigate('/login')}
        storeWhatsapp={settings?.whatsapp}
      />
    </MainLayout>
  );
};

export default Home;
