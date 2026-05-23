import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { BuyerTicket } from '../types';

interface CheckoutInput {
  tierId: string;
  quantity: number;
  attendees: {
    name: string;
    email: string;
    phone: string;
  }[];
}

export function useMyTickets() {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const res = await api.get('/api/tickets/my');
      return res.data.data as BuyerTicket[];
    },
    // Only fire when authenticated — prevents 401s on page load before store hydrates
    enabled: !!token,
    // Retry once on failure; don't hammer the server on genuine auth errors
    retry: 1
  });
}

export function useOrganizerTickets() {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['organizer-tickets'],
    queryFn: async () => {
      const res = await api.get('/api/tickets/organizer');
      return res.data.data as BuyerTicket[];
    },
    enabled: !!token,
    retry: 1
  });
}

export function usePurchaseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckoutInput) => {
      const res = await api.post('/api/tickets/checkout', input);
      return res.data.data as {
        orderId: string;
        reference: string;
        amount: number;
        accessCode: string;
        authorizationUrl: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    }
  });
}

