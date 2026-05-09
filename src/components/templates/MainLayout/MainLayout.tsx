import React from 'react';
import type { ReactNode } from 'react';
import Header from '../../organisms/Header/Header';
import FooterSection from '../../organisms/FooterSection/FooterSection';
import styles from './MainLayout.module.css';

export interface StoreSettings {
  logo_url: string;
  store_name: string;
  whatsapp: string;
}

interface MainLayoutProps {
  children: ReactNode;
  settings: StoreSettings | null;
  onCartClick: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, settings, onCartClick }) => {
  return (
    <div className={styles.layout}>
      <Header settings={settings} onCartClick={onCartClick} />
      <main className={styles.main}>{children}</main>
      <FooterSection />
      <footer className={styles.footer}>
        <p>© 2026 Loja do iPhone. Todos os direitos reservados.</p>
        <p className={styles.footerDev}>Desenvolvido por Geiciana Rodrigues</p>
      </footer>
    </div>
  );
};

export default MainLayout;
