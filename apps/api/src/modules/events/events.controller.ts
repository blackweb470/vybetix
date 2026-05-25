import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';
import sharp from 'sharp';

// 1. Zod Validation Schemas
export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  coverImageUrl: z.string().url('Cover image must be a valid URL'),
  category: z.enum(['music', 'campus', 'tech', 'comedy', 'church', 'sports', 'food', 'other'] as const),
  customCategory: z.string().nullable().optional(),
  customUniversity: z.string().nullable().optional(),
  city: z.string().min(2, 'City is required'),
  venue: z.string().min(3, 'Venue must be at least 3 characters'),
  eventDate: z.string().transform(val => new Date(val).toISOString()),
  endDate: z.string().transform(val => new Date(val).toISOString()),
  universityId: z.string().uuid().nullable().optional(),
  isUniversityOnly: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'cancelled', 'completed'] as const).default('draft'),
  tiers: z.array(z.object({
    name: z.string().min(2, 'Tier name is required'),
    description: z.string().min(5, 'Tier description is required'),
    price: z.number().int().nonnegative('Price must be in kobo and non-negative'),
    quantity: z.number().int().nonnegative('Quantity must be non-negative'),
    maxPerOrder: z.number().int().positive().default(5)
  })).optional()
});

export const updateEventSchema = createEventSchema.extend({
  tiers: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, 'Tier name is required'),
    description: z.string().min(5, 'Tier description is required'),
    price: z.number().int().nonnegative('Price must be in kobo and non-negative'),
    quantity: z.number().int().nonnegative('Quantity must be non-negative'),
    maxPerOrder: z.number().int().positive().default(5)
  })).optional()
}).partial();

const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base || 'event'}-${randomSuffix}`;
};

export const eventsController = {
  /**
   * Retrieves all universities registered in the platform.
   */
  getUniversities: async (req: Request, res: Response) => {
    try {
      const { data: universitiesList, error: queryError } = await supabase
        .from('universities')
        .select('*')
        .order('name', { ascending: true });

      if (queryError) {
        return error(res, 'Failed to fetch universities', queryError.message, 400);
      }

      return success(res, universitiesList, 'Universities retrieved successfully');
    } catch (err: any) {
      console.error('List universities error:', err);
      return error(res, 'Server error listing universities', err.message, 500);
    }
  },

  /**
   * Lists events with advanced filtering (city, category, search, university, is_university_only).
   */
  list: async (req: Request, res: Response) => {
    try {
      const { category, city, universityId, isUniversityOnly, search, limit, page } = req.query;
      const now = new Date().toISOString();

      // Pagination defaults
      const parsedLimit = parseInt(limit as string) || 50; // Default max 50 per request
      const parsedPage = parseInt(page as string) || 1;
      const from = (parsedPage - 1) * parsedLimit;
      const to = from + parsedLimit - 1;

      let query = supabase
        .from('events')
        .select('*, universities(*), organizer:users(full_name, email), ticket_tiers(id, name, price, quantity, sold, description)');

      // Filter by status: in a public list, only show published
      query = query.eq('status', 'published');

      if (category) {
        query = query.eq('category', category as string);
      }
      if (city) {
        query = query.eq('city', city as string);
      }
      if (universityId) {
        query = query.eq('university_id', universityId as string);
      }
      if (isUniversityOnly !== undefined) {
        query = query.eq('is_university_only', isUniversityOnly === 'true');
      }

      if (search) {
        const searchStr = String(search);
        query = query.or(`title.ilike.%${searchStr}%,description.ilike.%${searchStr}%,venue.ilike.%${searchStr}%`);
        // When searching: allow ended events through so users can still find them
        // (they will be visually marked as ended in the UI)
      } else {
        // Normal browse: hide events that have already ended
        query = query.gt('end_date', now);
      }

      // Order by event date ascending and apply pagination
      query = query.order('event_date', { ascending: true }).range(from, to);

      const { data: eventsList, error: queryError } = await query;

      if (queryError) {
        return error(res, 'Failed to fetch events', queryError.message, 400);
      }

      // Collect all tier IDs across all events
      const allTierIds = (eventsList || []).flatMap(e =>
        (e.ticket_tiers || []).map((t: any) => t.id)
      );

      // Count actual issued tickets per tier from the tickets table
      let tierCountMap: Record<string, number> = {};
      if (allTierIds.length > 0) {
        const { data: ticketRows } = await supabase
          .from('tickets')
          .select('tier_id')
          .in('tier_id', allTierIds);

        (ticketRows || []).forEach((t: any) => {
          if (t.tier_id) {
            tierCountMap[t.tier_id] = (tierCountMap[t.tier_id] || 0) + 1;
          }
        });
      }

      // Merge real sold counts into each tier, and attach is_ended flag
      const eventsWithRealCounts = (eventsList || []).map(event => ({
        ...event,
        is_ended: event.end_date ? new Date(event.end_date) < new Date() : false,
        ticket_tiers: (event.ticket_tiers || []).map((tier: any) => ({
          ...tier,
          sold: tierCountMap[tier.id] || 0
        }))
      }));

      return success(res, eventsWithRealCounts, 'Events retrieved successfully');
    } catch (err: any) {
      console.error('List events error:', err);
      return error(res, 'Server error listing events', err.message, 500);
    }
  },

  /**
   * Retrieves a single event along with its associated ticket tiers.
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const queryField = isUuid ? 'id' : 'slug';

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, universities(*), organizer:users(full_name, email)')
        .eq(queryField, id)
        .single();

      if (eventError || !event) {
        return error(res, 'Event not found', eventError?.message || 'The specified event does not exist', 404);
      }

      const { data: tiers, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', event.id)
        .order('price', { ascending: true });

      if (tiersError) {
        return error(res, 'Failed to fetch ticket tiers', tiersError.message, 400);
      }

      // Collect all tier IDs
      const tierIds = (tiers || []).map(t => t.id);

      // Count actual issued tickets per tier from the tickets table
      let tierCountMap: Record<string, number> = {};
      if (tierIds.length > 0) {
        const { data: ticketRows } = await supabase
          .from('tickets')
          .select('tier_id')
          .in('tier_id', tierIds);

        (ticketRows || []).forEach((t: any) => {
          if (t.tier_id) {
            tierCountMap[t.tier_id] = (tierCountMap[t.tier_id] || 0) + 1;
          }
        });
      }

      // Merge real sold counts into each tier
      const tiersWithRealCounts = (tiers || []).map((tier: any) => ({
        ...tier,
        sold: tierCountMap[tier.id] || 0
      }));

      // Attach is_ended flag so the frontend can block ticket purchasing
      const isEnded = event.end_date ? new Date(event.end_date) < new Date() : false;

      return success(res, { ...event, is_ended: isEnded, ticket_tiers: tiersWithRealCounts, tiers: tiersWithRealCounts }, 'Event details retrieved successfully');
    } catch (err: any) {
      console.error('Get event error:', err);
      return error(res, 'Server error getting event', err.message, 500);
    }
  },

  /**
   * Creates an event and optional ticket tiers in a single transaction-like sequence.
   */
  create: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'Organizer context required', 401);
      }

      // Map snake_case to camelCase and transform string fields
      if (req.body.cover_image_url && !req.body.coverImageUrl) req.body.coverImageUrl = req.body.cover_image_url;
      if (req.body.event_date && !req.body.eventDate) req.body.eventDate = req.body.event_date;
      if (req.body.end_date && !req.body.endDate) req.body.endDate = req.body.end_date;
      if (req.body.university_id && !req.body.universityId) req.body.universityId = req.body.university_id;
      if (req.body.is_university_only !== undefined && req.body.isUniversityOnly === undefined) {
        req.body.isUniversityOnly = req.body.is_university_only;
      }
      if (req.body.custom_category && !req.body.customCategory) req.body.customCategory = req.body.custom_category;
      if (req.body.custom_university && !req.body.customUniversity) req.body.customUniversity = req.body.custom_university;

      if (req.body.universityId === '') req.body.universityId = null;
      if (req.body.university_id === '') req.body.universityId = null;
      if (req.body.customCategory === '') req.body.customCategory = null;
      if (req.body.customUniversity === '') req.body.customUniversity = null;

      if (typeof req.body.isUniversityOnly === 'string') {
        req.body.isUniversityOnly = req.body.isUniversityOnly === 'true';
      }
      
      if (req.body.ticket_tiers && !req.body.tiers) {
        req.body.tiers = req.body.ticket_tiers;
      }
      if (typeof req.body.tiers === 'string') {
        try {
          req.body.tiers = JSON.parse(req.body.tiers);
        } catch (e) { }
      }

      const parsedData = createEventSchema.parse(req.body);
      const generatedSlug = generateSlug(parsedData.title);

      // 1. Insert Event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          organizer_id: req.user.id,
          university_id: parsedData.universityId || null,
          title: parsedData.title,
          slug: generatedSlug,
          description: parsedData.description,
          cover_image_url: parsedData.coverImageUrl,
          category: parsedData.category,
          custom_category: parsedData.customCategory || null,
          custom_university: parsedData.customUniversity || null,
          city: parsedData.city,
          venue: parsedData.venue,
          event_date: parsedData.eventDate,
          end_date: parsedData.endDate,
          status: parsedData.status,
          is_university_only: parsedData.isUniversityOnly
        })
        .select()
        .single();

      if (eventError || !event) {
        return error(res, 'Event creation failed', eventError?.message || 'Error writing event details', 400);
      }

      // 2. Insert Tiers if supplied
      if (parsedData.tiers && parsedData.tiers.length > 0) {
        const tiersToInsert = parsedData.tiers.map(t => ({
          event_id: event.id,
          name: t.name,
          description: t.description,
          price: t.price,
          quantity: t.quantity,
          sold: 0,
          max_per_order: t.maxPerOrder
        }));

        const { data: createdTiers, error: tiersError } = await supabase
          .from('ticket_tiers')
          .insert(tiersToInsert)
          .select();

        if (tiersError) {
          // Rollback event creation
          await supabase.from('events').delete().eq('id', event.id);
          return error(res, 'Ticket tiers creation failed', tiersError.message, 400);
        }

        return success(res, { ...event, ticket_tiers: createdTiers, tiers: createdTiers }, 'Event and ticket tiers created successfully', 201);
      }

      return success(res, { ...event, ticket_tiers: [], tiers: [] }, 'Event created successfully (no tiers)', 201);

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Create event error:', err);
      return error(res, 'Server error creating event', err.message, 500);
    }
  },

  /**
   * Updates an existing event.
   */
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const queryField = isUuid ? 'id' : 'slug';

      // Check ownership
      const { data: existing, error: existError } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq(queryField, id)
        .single();

      if (existError || !existing) {
        return error(res, 'Event not found', 'Could not locate event to update', 404);
      }

      if (existing.organizer_id !== req.user.id && req.user.role !== 'admin') {
        return error(res, 'Forbidden', 'You do not own this event', 403);
      }

      // Map snake_case to camelCase and transform string fields
      if (req.body.cover_image_url && !req.body.coverImageUrl) req.body.coverImageUrl = req.body.cover_image_url;
      if (req.body.event_date && !req.body.eventDate) req.body.eventDate = req.body.event_date;
      if (req.body.end_date && !req.body.endDate) req.body.endDate = req.body.end_date;
      if (req.body.university_id && !req.body.universityId) req.body.universityId = req.body.university_id;
      if (req.body.is_university_only !== undefined && req.body.isUniversityOnly === undefined) {
        req.body.isUniversityOnly = req.body.is_university_only;
      }
      if (req.body.custom_category && !req.body.customCategory) req.body.customCategory = req.body.custom_category;
      if (req.body.custom_university && !req.body.customUniversity) req.body.customUniversity = req.body.custom_university;

      if (req.body.universityId === '') req.body.universityId = null;
      if (req.body.university_id === '') req.body.universityId = null;
      if (req.body.customCategory === '') req.body.customCategory = null;
      if (req.body.customUniversity === '') req.body.customUniversity = null;

      if (typeof req.body.isUniversityOnly === 'string') {
        req.body.isUniversityOnly = req.body.isUniversityOnly === 'true';
      }

      if (req.body.ticket_tiers && !req.body.tiers) {
        req.body.tiers = req.body.ticket_tiers;
      }
      if (typeof req.body.tiers === 'string') {
        try {
          req.body.tiers = JSON.parse(req.body.tiers);
        } catch (e) { }
      }
      const parsedData = updateEventSchema.parse(req.body);
      const newSlug = parsedData.title ? generateSlug(parsedData.title) : undefined;

      const { data: updatedEvent, error: updateError } = await supabase
        .from('events')
        .update({
          university_id: parsedData.universityId !== undefined ? parsedData.universityId : undefined,
          title: parsedData.title,
          slug: newSlug,
          description: parsedData.description,
          cover_image_url: parsedData.coverImageUrl,
          category: parsedData.category,
          custom_category: parsedData.customCategory !== undefined ? parsedData.customCategory : undefined,
          custom_university: parsedData.customUniversity !== undefined ? parsedData.customUniversity : undefined,
          city: parsedData.city,
          venue: parsedData.venue,
          event_date: parsedData.eventDate,
          end_date: parsedData.endDate,
          status: parsedData.status,
          is_university_only: parsedData.isUniversityOnly
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return error(res, 'Update failed', updateError.message, 400);
      }

      // Update ticket tiers if supplied
      if (parsedData.tiers !== undefined) {
        // Fetch existing tiers for the event
        const { data: existingTiers, error: getTiersError } = await supabase
          .from('ticket_tiers')
          .select('id')
          .eq('event_id', existing.id);

        if (getTiersError) {
          return error(res, 'Failed to fetch existing ticket tiers', getTiersError.message, 400);
        }

        const existingTierIds = (existingTiers || []).map(t => t.id);
        const updatedTierIds = parsedData.tiers
          .map(t => t.id)
          .filter((id): id is string => !!id);

        // 1. Tiers to delete: present in DB but not in request
        const tierIdsToDelete = existingTierIds.filter(id => !updatedTierIds.includes(id));
        if (tierIdsToDelete.length > 0) {
          const { error: deleteTiersError } = await supabase
            .from('ticket_tiers')
            .delete()
            .in('id', tierIdsToDelete);

          if (deleteTiersError) {
            return error(res, 'Failed to delete obsolete ticket tiers', deleteTiersError.message, 400);
          }
        }

        // 2. Separate tiers to insert vs tiers to update
        const tiersToInsert: any[] = [];
        const tiersToUpdate: any[] = [];

        for (const t of parsedData.tiers) {
          if (t.id && existingTierIds.includes(t.id)) {
            tiersToUpdate.push(t);
          } else {
            tiersToInsert.push({
              event_id: existing.id,
              name: t.name,
              description: t.description,
              price: t.price,
              quantity: t.quantity,
              sold: 0,
              max_per_order: t.maxPerOrder ?? 5
            });
          }
        }

        // 3. Perform inserts
        if (tiersToInsert.length > 0) {
          const { error: insertTiersError } = await supabase
            .from('ticket_tiers')
            .insert(tiersToInsert);

          if (insertTiersError) {
            return error(res, 'Failed to create new ticket tiers', insertTiersError.message, 400);
          }
        }

        // 4. Perform updates
        for (const t of tiersToUpdate) {
          const { error: updateTierError } = await supabase
            .from('ticket_tiers')
            .update({
              name: t.name,
              description: t.description,
              price: t.price,
              quantity: t.quantity,
              max_per_order: t.maxPerOrder ?? 5
            })
            .eq('id', t.id);

          if (updateTierError) {
            return error(res, `Failed to update ticket tier: ${t.name}`, updateTierError.message, 400);
          }
        }
      }

      return success(res, updatedEvent, 'Event updated successfully');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Update event error:', err);
      return error(res, 'Server error updating event', err.message, 500);
    }
  },

  /**
   * Deletes an event.
   */
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const queryField = isUuid ? 'id' : 'slug';

      // Check ownership
      const { data: existing, error: existError } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq(queryField, id)
        .single();

      if (existError || !existing) {
        return error(res, 'Event not found', 'Could not locate event to delete', 404);
      }

      if (existing.organizer_id !== req.user.id && req.user.role !== 'admin') {
        return error(res, 'Forbidden', 'You do not own this event', 403);
      }

      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        return error(res, 'Deletion failed', deleteError.message, 400);
      }

      return success(res, null, 'Event deleted successfully');
    } catch (err: any) {
      console.error('Delete event error:', err);
      return error(res, 'Server error deleting event', err.message, 500);
    }
  },

  /**
   * Optimizes image buffers with Sharp and uploads directly to Supabase Storage event-covers bucket.
   */
  uploadCover: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return error(res, 'Upload error', 'No cover image file received', 400);
      }

      // Optimize image using sharp: resize to width 800px max, format to jpeg, quality 80
      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(800, 500, { fit: 'cover', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const fileName = `event-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpeg`;

      // Upload directly to Supabase Storage event-covers bucket
      // Note: We use upsert = true, content-type = image/jpeg
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-covers')
        .upload(fileName, optimizedBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return error(res, 'Supabase storage upload failed', uploadError.message, 500);
      }

      // Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-covers')
        .getPublicUrl(fileName);

      return success(res, { imageUrl: publicUrl }, 'Cover image uploaded and optimized successfully');

    } catch (err: any) {
      console.error('Upload cover error:', err);
      return error(res, 'Upload error', err.message, 500);
    }
  },

  /**
   * Add a staff member to an event
   */
  addStaff: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { email } = req.body;

      if (!email) {
        return error(res, 'Validation error', 'Email is required', 400);
      }

      // Check if organizer owns the event
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('id')
        .eq('id', id)
        .eq('organizer_id', req.user?.id)
        .single();

      if (eventErr || !event) {
        return error(res, 'Not found', 'Event not found or you are not the organizer', 404);
      }

      // Find if user with this email exists
      let userId = null;
      const { data: userData } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', email)
        .single();

      if (userData) {
        userId = userData.id;
        
        // If they are a buyer, upgrade them to gate_staff
        if (userData.role === 'buyer') {
          await supabase.from('users').update({ role: 'gate_staff' }).eq('id', userId);
        }
      }

      // Insert into event_staff
      const { error: insertErr } = await supabase
        .from('event_staff')
        .insert({
          event_id: id,
          email,
          user_id: userId
        });

      if (insertErr) {
        if (insertErr.code === '23505') {
          return error(res, 'Conflict', 'This email is already added as staff for this event', 409);
        }
        return error(res, 'Database error', 'Failed to add staff', 500);
      }

      return success(res, null, 'Staff added successfully');
    } catch (err: any) {
      console.error('Add staff error:', err);
      return error(res, 'Server error', err.message, 500);
    }
  },

  /**
   * Get all staff for an event
   */
  getStaff: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('id')
        .eq('id', id)
        .eq('organizer_id', req.user?.id)
        .single();

      if (eventErr || !event) {
        return error(res, 'Not found', 'Event not found or you are not the organizer', 404);
      }

      const { data: staff, error: staffErr } = await supabase
        .from('event_staff')
        .select('id, email, user_id, created_at, users(full_name)')
        .eq('event_id', id);

      if (staffErr) {
        return error(res, 'Database error', 'Failed to fetch staff', 500);
      }

      return success(res, staff, 'Staff retrieved successfully');
    } catch (err: any) {
      console.error('Get staff error:', err);
      return error(res, 'Server error', err.message, 500);
    }
  },

  /**
   * Remove a staff member
   */
  removeStaff: async (req: AuthRequest, res: Response) => {
    try {
      const { id, staffId } = req.params;

      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('id')
        .eq('id', id)
        .eq('organizer_id', req.user?.id)
        .single();

      if (eventErr || !event) {
        return error(res, 'Not found', 'Event not found or you are not the organizer', 404);
      }

      // Pre-fetch the user_id before deleting so we can update their role afterwards
      const { data: staffData } = await supabase
        .from('event_staff')
        .select('user_id')
        .eq('id', staffId)
        .eq('event_id', id)
        .single();

      const { error: delErr } = await supabase
        .from('event_staff')
        .delete()
        .eq('id', staffId)
        .eq('event_id', id);

      if (delErr) {
        return error(res, 'Database error', 'Failed to remove staff', 500);
      }

      // If they are registered users, check if they still have other staff assignments
      if (staffData?.user_id) {
        const { count } = await supabase
          .from('event_staff')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', staffData.user_id);

        // If they have 0 assignments left, downgrade their global role back to buyer
        if (count === 0) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', staffData.user_id)
            .single();

          if (userData && userData.role === 'gate_staff') {
            await supabase
              .from('users')
              .update({ role: 'buyer' })
              .eq('id', staffData.user_id);
          }
        }
      }

      return success(res, null, 'Staff removed successfully');
    } catch (err: any) {
      console.error('Remove staff error:', err);
      return error(res, 'Server error', err.message, 500);
    }
  },

  /**
   * Get events assigned to the gate staff
   */
  getAssignedEvents: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      const { data: assignments, error: queryError } = await supabase
        .from('event_staff')
        .select('event_id, events(id, title, slug, cover_image_url, event_date, venue, city)')
        .eq('user_id', req.user.id);

      if (queryError) {
        return error(res, 'Database error', 'Failed to fetch assigned events', 500);
      }

      // Supabase join returns an array of objects where 'events' is the joined data
      const assignedEvents = assignments.map(a => a.events).filter(e => e !== null);
      
      return success(res, assignedEvents, 'Assigned events retrieved successfully');
    } catch (err: any) {
      console.error('Get assigned events error:', err);
      return error(res, 'Server error', err.message, 500);
    }
  }
};

