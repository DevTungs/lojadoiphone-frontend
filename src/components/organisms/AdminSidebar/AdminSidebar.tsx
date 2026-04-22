import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Package,
  ShoppingCart,
  Users,
  UserCircle,
  Settings,
  LogOut,
  Tag,
  X,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './AdminSidebar.module.css';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <BarChart2 size={18} /> },
  { label: 'Produtos', path: '/admin/produtos', icon: <Package size={18} /> },
  { label: 'Pedidos', path: '/admin/pedidos', icon: <ShoppingCart size={18} /> },
  { label: 'Vendedores', path: '/admin/vendedores', icon: <Users size={18} /> },
  { label: 'Clientes', path: '/admin/clientes', icon: <UserCircle size={18} /> },
  { label: 'Promoções', path: '/admin/promocoes', icon: <Tag size={18} /> },
  { label: 'Configurações', path: '/admin/configuracoes', icon: <Settings size={18} /> },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path: string): boolean => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      {open && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <span>Loja do iPhone</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
              onClick={handleNavClick}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.bottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
