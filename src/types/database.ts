export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string
          city: string
          cnpj: string
          company_name: string
          created_at: string
          email: string
          id: string
          logo_url: string | null
          phone: string
          state: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          cnpj: string
          company_name: string
          created_at?: string
          email: string
          id?: string
          logo_url?: string | null
          phone: string
          state: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          cnpj?: string
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          phone?: string
          state?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          customer_id: string
          discount_amount: number
          id: string
          order_id: string | null
          used_at: string
        }
        Insert: {
          coupon_id: string
          customer_id: string
          discount_amount: number
          id?: string
          order_id?: string | null
          used_at?: string
        }
        Update: {
          coupon_id?: string
          customer_id?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_value: number | null
          name: string
          start_date: string
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          name: string
          start_date?: string
          type: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          name?: string
          start_date?: string
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          name: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label: string
          name: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          name?: string
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          created_at: string
          customer_id: string
          email_promotions: boolean
          id: string
          market_research: boolean
          newsletter: boolean
          order_notifications: boolean
          personalized_recommendations: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email_promotions?: boolean
          id?: string
          market_research?: boolean
          newsletter?: boolean
          order_notifications?: boolean
          personalized_recommendations?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email_promotions?: boolean
          id?: string
          market_research?: boolean
          newsletter?: boolean
          order_notifications?: boolean
          personalized_recommendations?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json | null
          cpf_cnpj: string | null
          created_at: string
          discount: number | null
          email: string | null
          id: string
          is_anonymous: boolean
          last_purchase: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          total_purchases: number | null
          total_spent: number | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          cpf_cnpj?: string | null
          created_at?: string
          discount?: number | null
          email?: string | null
          id?: string
          is_anonymous?: boolean
          last_purchase?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          total_purchases?: number | null
          total_spent?: number | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          cpf_cnpj?: string | null
          created_at?: string
          discount?: number | null
          email?: string | null
          id?: string
          is_anonymous?: boolean
          last_purchase?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          total_purchases?: number | null
          total_spent?: number | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          external_id: string | null
          id: string
          order_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          order_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          order_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          cons: string | null
          created_at: string
          customer_id: string
          helpful_count: number | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          product_id: string
          pros: string | null
          rating: number
          recommend: boolean | null
          sale_id: string | null
          status: string
          title: string | null
          updated_at: string
          verified_purchase: boolean | null
        }
        Insert: {
          comment?: string | null
          cons?: string | null
          created_at?: string
          customer_id: string
          helpful_count?: number | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          product_id: string
          pros?: string | null
          rating: number
          recommend?: boolean | null
          sale_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string | null
          cons?: string | null
          created_at?: string
          customer_id?: string
          helpful_count?: number | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          product_id?: string
          pros?: string | null
          rating?: number
          recommend?: boolean | null
          sale_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_selling_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string
          brand: string
          category: string
          cost: number
          created_at: string
          description: string
          height: number | null
          id: string
          images: string[] | null
          length: number | null
          min_stock: number
          name: string
          rating: number | null
          retail_price: number
          review_count: number | null
          sku: string
          status: string
          stock: number
          subcategory_id: string | null
          updated_at: string
          volumes: Json | null
          weight: number | null
          wholesale_price: number
          width: number | null
        }
        Insert: {
          barcode: string
          brand: string
          category: string
          cost: number
          created_at?: string
          description: string
          height?: number | null
          id?: string
          images?: string[] | null
          length?: number | null
          min_stock?: number
          name: string
          rating?: number | null
          retail_price: number
          review_count?: number | null
          sku: string
          status?: string
          stock?: number
          subcategory_id?: string | null
          updated_at?: string
          volumes?: Json | null
          weight?: number | null
          wholesale_price: number
          width?: number | null
        }
        Update: {
          barcode?: string
          brand?: string
          category?: string
          cost?: number
          created_at?: string
          description?: string
          height?: number | null
          id?: string
          images?: string[] | null
          length?: number | null
          min_stock?: number
          name?: string
          rating?: number | null
          retail_price?: number
          review_count?: number | null
          sku?: string
          status?: string
          stock?: number
          subcategory_id?: string | null
          updated_at?: string
          volumes?: Json | null
          weight?: number | null
          wholesale_price?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "category_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          product_sku: string
          quantity?: number
          sale_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_selling_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string
          customer_name: string
          customer_type: string
          discount_amount: number | null
          discount_percent: number | null
          estimated_delivery: string | null
          id: string
          notes: string | null
          order_source: string | null
          payment_external_id: string | null
          payment_method: string
          payment_method_detail: Json | null
          payment_status: string | null
          salesperson_name: string | null
          shipping_address_id: string | null
          shipping_cost: number | null
          shipping_method: string | null
          status: string
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_name: string
          customer_type?: string
          discount_amount?: number | null
          discount_percent?: number | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_source?: string | null
          payment_external_id?: string | null
          payment_method: string
          payment_method_detail?: Json | null
          payment_status?: string | null
          salesperson_name?: string | null
          shipping_address_id?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_type?: string
          discount_amount?: number | null
          discount_percent?: number | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_source?: string | null
          payment_external_id?: string | null
          payment_method?: string
          payment_method_detail?: Json | null
          payment_status?: string | null
          salesperson_name?: string | null
          shipping_address_id?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          reason: string
          supplier: string | null
          type: string
          user_id: string
          user_name: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          reason: string
          supplier?: string | null
          type: string
          user_id: string
          user_name: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          reason?: string
          supplier?: string | null
          type?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_selling_products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          auto_save: number
          created_at: string
          currency: string
          dark_theme: boolean
          email_notifications: boolean
          id: string
          sound_notifications: boolean
          stock_alert: number
          timezone: string
          updated_at: string
        }
        Insert: {
          auto_save?: number
          created_at?: string
          currency?: string
          dark_theme?: boolean
          email_notifications?: boolean
          id?: string
          sound_notifications?: boolean
          stock_alert?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          auto_save?: number
          created_at?: string
          currency?: string
          dark_theme?: boolean
          email_notifications?: boolean
          id?: string
          sound_notifications?: boolean
          stock_alert?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      tax_settings: {
        Row: {
          auto_email: boolean
          auto_nfe: boolean
          cofins_rate: number
          created_at: string
          icms_rate: number
          id: string
          nfe_environment: string
          nfe_series: string
          pis_rate: number
          tax_regime: string
          updated_at: string
        }
        Insert: {
          auto_email?: boolean
          auto_nfe?: boolean
          cofins_rate?: number
          created_at?: string
          icms_rate?: number
          id?: string
          nfe_environment?: string
          nfe_series?: string
          pis_rate?: number
          tax_regime?: string
          updated_at?: string
        }
        Update: {
          auto_email?: boolean
          auto_nfe?: boolean
          cofins_rate?: number
          created_at?: string
          icms_rate?: number
          id?: string
          nfe_environment?: string
          nfe_series?: string
          pis_rate?: number
          tax_regime?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_users: {
        Row: {
          auth_created_at: string | null
          auth_status: string | null
          created_at: string | null
          email: string | null
          email_confirmed_at: string | null
          id: string | null
          name: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      approved_reviews: {
        Row: {
          comment: string | null
          cons: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          helpful_count: number | null
          id: string | null
          product_brand: string | null
          product_id: string | null
          product_name: string | null
          pros: string | null
          rating: number | null
          recommend: boolean | null
          title: string | null
          verified_purchase: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_selling_products"
            referencedColumns: ["id"]
          },
        ]
      }
      category_hierarchy: {
        Row: {
          description: string | null
          full_path: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          level: number | null
          name: string | null
          parent_id: string | null
          parent_name: string | null
          parent_slug: string | null
          slug: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales_summary: {
        Row: {
          avg_ticket: number | null
          sale_date: string | null
          total_revenue: number | null
          total_sales: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      ecommerce_orders: {
        Row: {
          city: string | null
          complement: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_type: string | null
          discount_amount: number | null
          discount_percent: number | null
          estimated_delivery: string | null
          id: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          order_source: string | null
          payment_external_id: string | null
          payment_method: string | null
          payment_method_detail: Json | null
          payment_status: string | null
          salesperson_name: string | null
          shipping_address_id: string | null
          shipping_cost: number | null
          shipping_method: string | null
          shipping_name: string | null
          state: string | null
          status: string | null
          street: string | null
          subtotal: number | null
          total: number | null
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
          zip_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_low_stock: boolean | null
          min_stock: number | null
          name: string | null
          rating: number | null
          retail_price: number | null
          review_count: number | null
          sku: string | null
          status: string | null
          stock: number | null
          units_needed: number | null
          updated_at: string | null
          volumes: Json | null
          wholesale_price: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_low_stock?: never
          min_stock?: number | null
          name?: string | null
          rating?: number | null
          retail_price?: number | null
          review_count?: number | null
          sku?: string | null
          status?: string | null
          stock?: number | null
          units_needed?: never
          updated_at?: string | null
          volumes?: Json | null
          wholesale_price?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_low_stock?: never
          min_stock?: number | null
          name?: string | null
          rating?: number | null
          retail_price?: number | null
          review_count?: number | null
          sku?: string | null
          status?: string | null
          stock?: number | null
          units_needed?: never
          updated_at?: string | null
          volumes?: Json | null
          wholesale_price?: number | null
        }
        Relationships: []
      }
      top_selling_products: {
        Row: {
          brand: string | null
          category: string | null
          id: string | null
          name: string | null
          rating: number | null
          review_count: number | null
          times_sold: number | null
          total_revenue: number | null
          total_sold: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_admin_auth_user: {
        Args: { user_email: string; user_name?: string; user_password: string }
        Returns: Json
      }
      debug_profile_access: {
        Args: { user_id: string }
        Returns: {
          auth_uid: string
          can_access_own: boolean
          is_admin: boolean
          profile_exists: boolean
          user_id_param: string
        }[]
      }
      get_category_path: {
        Args: { category_id: string }
        Returns: string
      }
      get_subcategories: {
        Args: { category_id: string }
        Returns: {
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
        }[]
      }
      increment_coupon_usage: {
        Args: { coupon_id: string }
        Returns: undefined
      }
      update_product_stock: {
        Args: { product_id: string; quantity_sold: number }
        Returns: undefined
      }
      validate_cpf_cnpj: {
        Args: { customer_type: string; document: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
