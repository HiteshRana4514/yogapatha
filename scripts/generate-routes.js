import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing from .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateRoutes() {
  console.log('Fetching dynamic routes from Supabase...');
  
  const routes = [
    '/',
    '/services',
    '/about_us',
    '/contact_us',
    '/media',
    '/blogs',
    '/locations',
    '/yttc',
    '/privacy-policy',
    '/terms-and-conditions',
    '/trainer-code-of-conduct'
  ];

  try {
    // Fetch Blogs
    const { data: blogs, error: blogErr } = await supabase
      .from('blogs')
      .select('slug')
      .eq('published', true);
    if (blogErr) console.warn('Error fetching blogs:', blogErr.message);
    else if (blogs) blogs.forEach(b => routes.push(`/blogs/${b.slug}`));

    // Fetch Services
    const { data: services, error: serviceErr } = await supabase
      .from('services')
      .select('id')
      .eq('is_active', true);
    if (serviceErr) console.warn('Error fetching services:', serviceErr.message);
    else if (services) services.forEach(s => routes.push(`/services/${s.id}`));

    // Fetch YTTC Courses
    const { data: courses, error: courseErr } = await supabase
      .from('courses')
      .select('slug')
      .eq('is_active', true);
    if (courseErr) console.warn('Error fetching courses:', courseErr.message);
    else if (courses) courses.forEach(c => routes.push(`/yttc/${c.slug}`));

    // Fetch Trainers
    const { data: trainers, error: trainerErr } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'trainer');
    if (trainerErr) console.warn('Error fetching trainers:', trainerErr.message);
    else if (trainers) trainers.forEach(t => routes.push(`/trainer/${t.id}`));

    // Fetch Locations (States & Cities)
    const { data: states, error: stateErr } = await supabase
      .from('states')
      .select('id, slug')
      .eq('is_active', true);
    
    if (stateErr) console.warn('Error fetching states:', stateErr.message);
    else if (states) {
      for (const state of states) {
        routes.push(`/locations/${state.slug}`);
        
        const { data: cities, error: cityErr } = await supabase
          .from('cities')
          .select('slug')
          .eq('state_id', state.id)
          .eq('is_active', true);
          
        if (cityErr) console.warn(`Error fetching cities for ${state.slug}:`, cityErr.message);
        else if (cities) cities.forEach(c => routes.push(`/locations/${state.slug}/${c.slug}`));
      }
    }

    fs.writeFileSync('routes.json', JSON.stringify(routes, null, 2));
    console.log(`Successfully generated routes.json with ${routes.length} paths.`);
  } catch (error) {
    console.error('Failed to generate routes:', error);
    process.exit(1);
  }
}

generateRoutes();
