export * from '@vibetix/shared';

// Additional frontend types representing the actual database schemas and filters
export interface University {
  id: string;
  name: string;
  short_code: string;
  email_domain: string;
  city: string;
  active: boolean;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number; // in kobo
  quantity: number;
  sold: number;
  created_at: string;
}

export interface EventDetail {
  id: string;
  slug: string;
  organizer_id: string;
  title: string;
  description: string;
  category: string;
  custom_category?: string;
  custom_university?: string;
  event_date: string;
  end_date?: string;
  venue: string;
  city: string;
  cover_image_url?: string;
  is_university_only: boolean;
  university_id?: string;
  is_published: boolean;
  created_at: string;
  ticket_tiers?: TicketTier[];
  tiers?: TicketTier[];
}

export interface BuyerTicket {
  id: string;
  order_id: string;
  ticket_tier_id: string;
  holder_name: string;
  holder_email: string;
  holder_phone: string;
  status: 'active' | 'used' | 'cancelled';
  scanned_at?: string;
  created_at: string;
  device_locked?: boolean;
  device_fingerprint?: string;
  is_device_mismatch?: boolean;
  qr_token?: string | null;
  ticket_tiers?: {
    name: string;
    price: number;
    events?: {
      title: string;
      cover_image_url?: string;
      venue: string;
      event_date: string;
    };
  };
}

