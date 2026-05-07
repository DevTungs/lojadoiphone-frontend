import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  Product,
  Seller,
  Order,
  OrderItem,
  StoreSettings,
  Stats,
  Customer,
  Promotion,
} from '../types/index';

const rawApiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_BASE_URL = String(rawApiBaseUrl).replace(/\/+$/, '');

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor: attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 by clearing token and redirecting to /admin
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasAdminSession = Boolean(localStorage.getItem('auth_token'));
    if (error.response?.status === 401 && hasAdminSession) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ─── Products ────────────────────────────────────────────────────────────────

export const getProducts = (): Promise<{ data: Product[] }> => {
  const customerToken = localStorage.getItem('customer_token');
  return api.get('/products', {
    headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
  });
};

export const getProduct = (id: number): Promise<{ data: Product }> =>
  api.get(`/products/${id}`);

export const getAllProductsAdmin = (): Promise<{ data: Product[] }> =>
  api.get('/products/admin/all');

export const createProduct = (
  data: Omit<Product, 'id' | 'created_at'>
): Promise<{ data: Product }> => api.post('/products', data);

export const updateProduct = (
  id: number,
  data: Partial<Omit<Product, 'id' | 'created_at'>>
): Promise<{ data: Product }> => api.put(`/products/${id}`, data);

export const deleteProduct = (id: number): Promise<{ data: void }> =>
  api.delete(`/products/${id}`);

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  customer_name: string;
  phone: string;
  seller_id: number;
  items: OrderItem[];
}

export interface PixPayment {
  provider?: string;
  status?: string;
  qrCodeId?: string;
  externalId?: string;
  paymentString?: string;
  qrCode?: string;
  amount?: number;
  expirationDate?: string;
}

export interface PixPaymentResponse {
  success: boolean;
  payment: PixPayment;
  reused?: boolean;
}

export interface AdminTcrWebhook {
  id: number;
  id_chave: number | null;
  url: string;
  eventos: string[];
  ativo: boolean;
  criado_em: string;
}

export interface AdminTcrWebhookListResponse {
  webhooks: AdminTcrWebhook[];
  target_url: string | null;
  matched: boolean;
  webhook_secret_configured: boolean;
}

export interface AdminTcrWebhookSyncResponse extends AdminTcrWebhookListResponse {
  already_existed: boolean;
  secret_assinatura: string | null;
}

export const createOrder = (
  data: CreateOrderPayload
): Promise<{ data: Order }> => api.post('/orders', data);

export const trackOrder = (
  orderId: number | string,
  phone: string
): Promise<{ data: Order }> =>
  api.get('/orders/track', { params: { order_id: orderId, phone } });

export const getMyOrders = (phone: string): Promise<{ data: Order[] }> =>
  api.get('/orders/my', { params: { phone } });

export const getOrders = (): Promise<{ data: Order[] }> =>
  api.get('/orders');

export const getOrder = (id: number): Promise<{ data: Order }> =>
  api.get(`/orders/${id}`);

export const updateOrderStatus = (
  id: number,
  status: number
): Promise<{ data: Order }> => api.patch(`/orders/${id}/status`, { status });

export const generateOrderPixPayment = (
  id: number
): Promise<{ data: PixPaymentResponse }> => api.post(`/orders/${id}/payment/pix`);

export const getOrderPayment = (
  id: number
): Promise<{ data: PixPayment }> => api.get(`/orders/${id}/payment`);

export const getAdminTcrWebhooks = (): Promise<{ data: AdminTcrWebhookListResponse }> =>
  api.get('/orders/payment/webhooks');

export const syncAdminTcrWebhook = (): Promise<{ data: AdminTcrWebhookSyncResponse }> =>
  api.post('/orders/payment/webhooks/sync');

// ─── Sellers ─────────────────────────────────────────────────────────────────

export const getSellers = (): Promise<{ data: Seller[] }> =>
  api.get('/sellers');

export const getSellersRanking = (): Promise<{ data: Seller[] }> =>
  api.get('/sellers/ranking');

export const getSellerBySlug = (slug: string): Promise<{ data: Seller }> =>
  api.get(`/sellers/by-slug/${slug}`);

export const createSeller = (
  data: Omit<Seller, 'id' | 'sales_count'>
): Promise<{ data: Seller }> => api.post('/sellers', data);

export const updateSeller = (
  id: number,
  data: Partial<Omit<Seller, 'id' | 'sales_count'>>
): Promise<{ data: Seller }> => api.put(`/sellers/${id}`, data);

export const deleteSeller = (id: number): Promise<{ data: void }> =>
  api.delete(`/sellers/${id}`);

export interface SellerStats {
  seller: { id: number; name: string; phone: string; photo_url: string; sales_count: number };
  totals: { total_orders: number; total_revenue: number };
  byDay: Array<{ day: string; orders: number; revenue: number }>;
}

export const getSellerStats = (
  id: number,
  params: { period?: string; from?: string; to?: string }
): Promise<{ data: SellerStats }> =>
  api.get(`/sellers/${id}/stats`, { params });

// ─── Customers ───────────────────────────────────────────────────────────────

export const getCustomers = (): Promise<{ data: Customer[] }> =>
  api.get('/customers');

export const createCustomer = (
  data: Omit<Customer, 'id' | 'created_at'>
): Promise<{ data: Customer }> => api.post('/customers', data);

export const updateCustomer = (
  id: number,
  data: Omit<Customer, 'id' | 'created_at'>
): Promise<{ data: Customer }> => api.put(`/customers/${id}`, data);

export const deleteCustomer = (id: number): Promise<{ data: void }> =>
  api.delete(`/customers/${id}`);

export const toggleCustomerVip = (id: number): Promise<{ data: { is_vip: number } }> =>
  api.patch(`/customers/${id}/vip`);

export const registerCustomer = (
  data: Omit<Customer, 'id' | 'created_at'>
): Promise<{ data: Customer }> => api.post('/customers/register', data);

// ─── Settings ────────────────────────────────────────────────────────────────

export const getSettings = (): Promise<{ data: StoreSettings }> =>
  api.get('/settings');

export const updateSettings = (
  data: Partial<StoreSettings>
): Promise<{ data: StoreSettings }> => api.put('/settings', data);

export const getStats = (): Promise<{ data: Stats }> =>
  api.get('/settings/stats');

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// ─── Promotions ──────────────────────────────────────────────────────────────

export const getPromotions = (): Promise<{ data: Promotion[] }> =>
  api.get('/promotions');

export const getAllPromotionsAdmin = (): Promise<{ data: Promotion[] }> =>
  api.get('/promotions/admin/all');

export const createPromotion = (
  data: Omit<Promotion, 'id' | 'created_at'>
): Promise<{ data: Promotion }> => api.post('/promotions', data);

export const updatePromotion = (
  id: number,
  data: Partial<Omit<Promotion, 'id' | 'created_at'>>
): Promise<{ data: Promotion }> => api.put(`/promotions/${id}`, data);

export const deletePromotion = (id: number): Promise<{ data: void }> =>
  api.delete(`/promotions/${id}`);

export const login = (
  email: string,
  password: string
): Promise<{ data: LoginResponse }> =>
  api.post('/auth/login', { email, password });

// ─── Stats (Dashboard) ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
}

export interface SellerPerformance {
  seller_id: number;
  seller_name: string;
  orders: number;
  total: number;
}

export interface ProductPerformance {
  product_id: number;
  product_name: string;
  quantity: number;
  total: number;
}

export const getDashboardStats = (
  period?: 'today' | 'week' | 'month' | 'all'
): Promise<{ data: DashboardStats }> =>
  api.get('/stats/dashboard', { params: period ? { period } : {} });

export const getSellerPerformance = (
  period?: 'today' | 'week' | 'month' | 'all'
): Promise<{ data: SellerPerformance[] }> =>
  api.get('/stats/sellers-performance', { params: period ? { period } : {} });

export const getProductPerformance = (
  period?: 'today' | 'week' | 'month' | 'all'
): Promise<{ data: ProductPerformance[] }> =>
  api.get('/stats/products-performance', { params: period ? { period } : {} });

export default api;