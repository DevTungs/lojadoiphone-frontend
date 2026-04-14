import { useState } from 'react';
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { PRODUCT_CATEGORIES } from '../../../types/index';
import { assetUrl } from '../../../utils/assetUrl';
import styles from './Header.module.css';

interface StoreSettings {
  logo_url: string;
  store_name: string;
  whatsapp: string;
}

interface HeaderProps {
  settings: StoreSettings | null;
  onCartClick: () => void;
}

export default function Header({ settings, onCartClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const { itemCount } = useCart();
  const { isAuthenticated, logout, user } = useAuth();
  const { customer, isLoggedIn: isCustomerLoggedIn, logout: customerLogout } = useCustomerAuth();
  const navigate = useNavigate();

  // Customer area takes precedence if both auth states exist in storage.
  const isAdminSession = isAuthenticated && user?.role === 'admin';
  const showCustomerSession = isCustomerLoggedIn;
  const showAdminSession = !showCustomerSession && isAdminSession;
  const showLoginButton = !showCustomerSession && !showAdminSession;

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logoGroup}>
          <Link to="/" className={styles.logoLink} onClick={closeMenu}>
            {settings?.logo_url ? (
              <img
                src={assetUrl(settings.logo_url)}
                alt={settings.store_name}
                className={styles.logoImg}
              />
            ) : (
              <span className={styles.logo}>{settings?.store_name ?? 'Loja do iPhone'}</span>
            )}
          </Link>
        </div>

        {/* Nav — centro */}
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link to="/" className={styles.navLink} onClick={closeMenu}>Início</Link>

          {/* Produtos com cascata */}
          <div
            className={styles.dropdown}
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <Link to="/produtos" className={styles.navLink}>
              Produtos <ChevronDown size={14} className={`${styles.chevron} ${productsOpen ? styles.chevronOpen : ''}`} />
            </Link>
            {productsOpen && (
              <div className={styles.dropdownMenu}>
                <Link to="/produtos" className={styles.dropdownItem} onClick={() => setProductsOpen(false)}>
                  Todos os produtos
                </Link>
                <div className={styles.dropdownDivider} />
                {PRODUCT_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/produtos?categoria=${encodeURIComponent(cat)}`}
                    className={styles.dropdownItem}
                    onClick={() => setProductsOpen(false)}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/pedido" className={styles.navLink}>Rastrear Pedido</Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Cart */}
          <button
            className={styles.cartBtn}
            onClick={onCartClick}
            aria-label={`Carrinho${itemCount > 0 ? `, ${itemCount} item${itemCount > 1 ? 's' : ''}` : ''}`}
          >
            <ShoppingCart size={22} strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount > 99 ? '99+' : itemCount}</span>
            )}
          </button>

          {/* Entrar — cliente não logado e não é admin */}
          {showLoginButton && (
            <Link to="/login" className={styles.loginBtn}>
              <User size={16} strokeWidth={2} />
              Entrar
            </Link>
          )}

          {/* Cliente logado */}
          {showCustomerSession && (
            <div className={styles.userMenu}>
              <Link to="/minha-conta" className={styles.avatarBtn}>
                <span className={styles.avatar}>
                  <User size={16} strokeWidth={2} />
                </span>
                <span className={styles.userName}>{customer?.name?.split(' ')[0]}</span>
              </Link>
              <button className={styles.logoutBtn} onClick={() => { customerLogout(); closeMenu(); }}>
                Sair
              </button>
            </div>
          )}

          {/* Auth — visível apenas para admin */}
          {showAdminSession && (
            <div className={styles.userMenu}>
              <Link to="/admin" className={styles.avatarBtn}>
                <span className={styles.avatar}>
                  <User size={16} strokeWidth={2} />
                </span>
                <span className={styles.userName}>Admin</span>
              </Link>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Sair
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button
            className={styles.menuBtn}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="navigation" aria-label="Menu mobile">
          <Link to="/" className={styles.mobileNavLink} onClick={closeMenu}>Início</Link>
          <Link to="/produtos" className={styles.mobileNavLink} onClick={closeMenu}>Todos os produtos</Link>
          {PRODUCT_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/produtos?categoria=${encodeURIComponent(cat)}`}
              className={`${styles.mobileNavLink} ${styles.mobileNavSub}`}
              onClick={closeMenu}
            >
              {cat}
            </Link>
          ))}
          <Link to="/pedido" className={styles.mobileNavLink} onClick={closeMenu}>Rastrear Pedido</Link>
          {showCustomerSession ? (
            <>
              <Link to="/minha-conta" className={styles.mobileNavLink} onClick={closeMenu}>Minha Conta</Link>
              <button className={styles.mobileNavLink} onClick={() => { customerLogout(); closeMenu(); }}>Sair</button>
            </>
          ) : showAdminSession ? (
            <button className={styles.mobileNavLink} onClick={handleLogout}>Sair (Admin)</button>
          ) : (
            <Link to="/login" className={styles.mobileNavLink} onClick={closeMenu}>Entrar</Link>
          )}
        </div>
      )}
    </header>
  );
}
