import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EventDetail } from '../types';

interface EventFilters {
  city?: string;
  category?: string;
  search?: string;
  isUniversityOnly?: boolean;
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

      const res = await api.get(`/api/events?${params.toString()}`);
      return res.data.data as EventDetail[];
    }
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/api/events/${id}`);
      return res.data.data as EventDetail;
    },
    enabled: !!id
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
    }
  });
}

export function useOrganizerEvents() {
  return useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => {
      const res = await api.get('/api/organizer/events');
      return res.data.data as EventDetail[];
    }
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

