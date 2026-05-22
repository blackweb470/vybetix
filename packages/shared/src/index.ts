export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export type TicketStatus = 'available' | 'sold_out' | 'reserved';
export type TicketCategory = 'Concerts' | 'Sports' | 'Theater' | 'Festivals';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  price: number;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: TicketCategory;
  imageUrl: string;
  status: TicketStatus;
  availableQuantity: number;
  totalQuantity: number;
  featured?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  price: number;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: TicketCategory;
  totalQuantity: number;
}
