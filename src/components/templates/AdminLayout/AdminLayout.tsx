import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import AdminSidebar from '../../organisms/AdminSidebar/AdminSidebar';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    } else if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
