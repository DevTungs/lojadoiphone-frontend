export const PRODUCT_CATEGORIES = ['Aparelhos de reparo', 'Apple Watch', 'iPhones', 'Lote de leilão'] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  storage: string;
  color: string;
  image_url: string;
  stock: number;
  active: number;
  is_vip?: number;
  category?: ProductCategory | string;
  created_at: string;
}

export interface Seller {
  id: number;
  name: string;
  phone?: string;
  photo_url?: string;
  slug?: string;
  sales_count?: number;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  phone: string;
  seller_id: number;
  seller_name?: string;
  status: number;
  total_price: number;
  created_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreSettings {
  logo_url: string;
  favicon_url: string;
  store_name: string;
  whatsapp: string;
}

export interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalSales: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  password?: string;
  is_vip?: number;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Promotion {
  id: number;
  title: string;
  image_url: string | null;
  link_url: string | null;
  price: number;
  active: number;
  sort_order: number;
  created_at: string;
}
