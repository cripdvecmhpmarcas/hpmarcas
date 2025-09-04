import type { Tables } from './database';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export * from './sales';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: "user" | "admin";
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Tables<'products'>;
}
