// Blog related types
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  featured_image: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  view_count?: number;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  created_at: string;
}

// Newsletter related types
export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribed_at: string;
  is_active: boolean;
  preferences?: {
    blog_updates: boolean;
    product_updates: boolean;
    promotions: boolean;
  };
  tags?: string[];
}

export interface NewsletterCampaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  template_id?: string;
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  recipient_count?: number;
  open_rate?: number;
  click_rate?: number;
  created_at: string;
  updated_at: string;
}

// WhatsApp integration types
export interface WhatsAppContact {
  id: string;
  phone_number: string;
  name?: string;
  user_id?: string;
  last_message_at?: string;
  is_blocked: boolean;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  contact_id: string;
  message: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video';
  media_url?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: 'support' | 'marketing' | 'order' | 'general';
  is_active: boolean;
  created_at: string;
}

// SEO related types
export interface SEOMetaData {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

// Common utility types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: string;
}

export interface FilterOptions {
  category?: string;
  tags?: string[];
  author?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}