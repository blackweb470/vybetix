import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabase
    .from('events')
    .insert({
      organizer_id: '123e4567-e89b-12d3-a456-426614174000', // random uuid
      title: 'Test Event',
      slug: 'test-event-edo-' + Date.now(),
      description: 'Testing edo city',
      cover_image_url: 'https://example.com/cover.jpg',
      category: 'music',
      city: 'edo',
      venue: 'Some Venue',
      event_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      status: 'draft',
      is_university_only: false
    });

  console.log('Result for edo:', data, error);
}

main().catch(console.error);
