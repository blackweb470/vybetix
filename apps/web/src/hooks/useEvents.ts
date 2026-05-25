import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EventDetail } from '../types';

interface EventFilters {
  city?: string;
  category?: string;
  search?: string;
  isUniversityOnly?: boolean;
  limit?: number;
  page?: number;
}

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.city) params.append('city', filters.city);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.isUniversityOnly !== undefined) {
        params.append('isUniversityOnly', String(filters.isUniversityOnly));
      }
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const res = await api.get(`/api/events?${params.toString()}`);
      return res.data.data as EventDetail[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useEvent(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/api/events/${id}`);
      return res.data.data as EventDetail;
    },
    initialData: () => {
      // 1. Try to find the event in the organizer's cached events
      const orgEvents = queryClient.getQueryData<EventDetail[]>(['organizer-events']);
      if (orgEvents) {
        const found = orgEvents.find(e => e.id === id);
        if (found) return found;
      }

      // 2. Try to find the event in the general public events queries
      const queries = queryClient.getQueriesData<EventDetail[]>({ queryKey: ['events'] });
      for (const [_, data] of queries) {
        if (Array.isArray(data)) {
          const found = data.find(e => e.id === id);
          if (found) return found;
        }
      }

      return undefined;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/api/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data.data as EventDetail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
}

export function useUniversities() {
  return useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const res = await api.get('/api/events/universities');
      return res.data.data as any[];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (universities rarely change)
  });
}

export function useOrganizerEvents() {
  return useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => {
      const res = await api.get('/api/organizer/events');
      return res.data.data as EventDetail[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await api.put(`/api/events/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data.data as EventDetail;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    }
  });
}

export function useUploadCoverImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await api.post('/api/events/upload-cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data.data.imageUrl as string;
    }
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/events/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    }
  });
}
