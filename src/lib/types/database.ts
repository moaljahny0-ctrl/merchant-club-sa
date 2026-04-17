export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'platform_admin' | 'brand_owner' | 'brand_staff' | 'creator' | 'customer'

export type BrandStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'rejected'

export type OnboardingState =
  | 'invited'
  | 'account_setup'
  | 'profile_setup'
  | 'products_setup'
  | 'submitted'
  | 'live'

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'info_requested'

export type ProductStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'live'
  | 'archived'
  | 'out_of_stock'

export type StorefrontStatus = 'draft' | 'submitted' | 'approved' | 'live' | 'suspended'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'fulfilling'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

// ─── Row Types ────────────────────────────────────────────────────────────────

export interface Role {
  id: string
  name: UserRole
}

export interface UserRoleRow {
  user_id: string
  role_id: string
}

export interface Brand {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  description_en: string | null
  description_ar: string | null
  tagline_en: string | null
  tagline_ar: string | null
  logo_url: string | null
  banner_url: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  shipping_info_en: string | null
  shipping_info_ar: string | null
  return_policy_en: string | null
  return_policy_ar: string | null
  fulfillment_lead_days: number | null
  legal_name: string | null
  commercial_reg_number: string | null
  vat_number: string | null
  status: BrandStatus
  onboarding_state: OnboardingState
  terms_accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface BrandMember {
  id: string
  brand_id: string
  user_id: string
  role: 'brand_owner' | 'brand_staff'
  invited_by: string | null
  invited_at: string
  joined_at: string | null
  status: 'invited' | 'active' | 'suspended'
}

export interface BrandApplication {
  id: string
  brand_name_en: string
  brand_name_ar: string | null
  category: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  instagram_url: string | null
  website_url: string | null
  brand_description: string | null
  referral_source: string | null
  status: ApplicationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  brand_id: string | null
  created_at: string
}

export interface Product {
  id: string
  brand_id: string
  sku: string | null
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  price: number
  sale_price: number | null
  currency: string
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  category: string
  tags: string[] | null
  status: ProductStatus
  rejection_reason: string | null
  rejection_code: string | null
  is_featured: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  storage_path: string
  alt_text_en: string | null
  alt_text_ar: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface Storefront {
  id: string
  brand_id: string
  status: StorefrontStatus
  is_published: boolean
  featured_product_ids: string[] | null
  visibility: 'public' | 'hidden'
  submitted_at: string | null
  approved_at: string | null
  approved_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CreatorLink {
  id: string
  creator_id: string
  brand_id: string
  link_code: string
  commission_rate: number
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  brand_id: string
  order_number: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  delivery_address: Json | null
  items: Json
  subtotal: number
  platform_commission: number | null
  creator_commission: number | null
  creator_link_id: string | null
  status: OrderStatus
  fulfillment_status: string | null
  tracking_number: string | null
  brand_notes: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface AnalyticsEvent {
  id: string
  event_type: 'storefront_view' | 'product_view' | 'creator_link_click' | 'order_placed'
  brand_id: string | null
  product_id: string | null
  creator_link_id: string | null
  session_id: string | null
  ip_hash: string | null
  created_at: string
}

// ─── Table helper types ───────────────────────────────────────────────────────

type TableDef<R, I = Partial<R>, U = Partial<R>> = {
  Row: R
  Insert: I
  Update: U
  Relationships: []
}

// ─── Database type for Supabase client ───────────────────────────────────────

export interface Database {
  public: {
    PostgrestVersion: '12'
    Tables: {
      roles: TableDef<Role, Omit<Role, 'id'>>
      user_roles: TableDef<UserRoleRow>
      brands: TableDef<Brand, Omit<Brand, 'id' | 'created_at' | 'updated_at'>>
      brand_members: TableDef<BrandMember, Omit<BrandMember, 'id' | 'invited_at'>>
      brand_applications: TableDef<BrandApplication, Omit<BrandApplication, 'id' | 'created_at'>>
      products: TableDef<Product, Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      product_images: TableDef<ProductImage, Omit<ProductImage, 'id' | 'created_at'>>
      storefronts: TableDef<Storefront, Omit<Storefront, 'id' | 'created_at' | 'updated_at'>>
      creator_links: TableDef<CreatorLink, Omit<CreatorLink, 'id' | 'created_at'>>
      orders: TableDef<Order, Omit<Order, 'id' | 'created_at' | 'updated_at'>>
      analytics_events: TableDef<AnalyticsEvent, Omit<AnalyticsEvent, 'id' | 'created_at'>>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Composite types used by the UI ──────────────────────────────────────────

export type ProductWithImages = Product & { product_images: ProductImage[] }

export type BrandWithStorefront = Brand & { storefronts: Storefront | null }

export type OrderWithCreator = Order & { creator_links: Pick<CreatorLink, 'link_code' | 'commission_rate'> | null }
