import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
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
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const res = await api.get('/api/tickets/my');
      return res.data.data as BuyerTicket[];
    }
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
