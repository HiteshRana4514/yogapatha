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

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();
}

async function generateRoutes() {
  console.log('Fetching dynamic routes and metadata from Supabase...');
  
  const routes = [];

  // Add static routes
  const staticPaths = [
    { route: '/', title: 'YogaPatha | Find Certified Yoga Trainers Across India' },
    { route: '/services', title: 'Our Services | YogaPatha' },
    { route: '/about_us', title: 'About Us | YogaPatha' },
    { route: '/contact_us', title: 'Contact Us | YogaPatha' },
    { route: '/media', title: 'Media | YogaPatha' },
    { route: '/blogs', title: 'Yoga Blogs | YogaPatha' },
    { route: '/locations', title: 'Locations | YogaPatha' },
    { route: '/yttc', title: 'YTTC Courses | YogaPatha' },
    { route: '/privacy-policy', title: 'Privacy Policy | YogaPatha' },
    { route: '/terms-and-conditions', title: 'Terms & Conditions | YogaPatha' },
    { route: '/trainer-code-of-conduct', title: 'Trainer Code of Conduct | YogaPatha' }
  ];

  staticPaths.forEach(path => {
    routes.push({
      route: path.route,
      meta: {
        title: path.title,
        description: 'Connect with certified yoga trainers for personalized online and home sessions across India.',
        image: 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
      }
    });
  });

  try {
    // Fetch Blogs
    const { data: blogs } = await supabase.from('blogs').select('slug, title, description, content, image_url').eq('published', true);
    if (blogs) {
      blogs.forEach(b => routes.push({
        route: `/blogs/${b.slug}`,
        meta: {
          title: `${b.title} | Yoga Blogs | YogaPatha`,
          description: b.description || stripHtml(b.content),
          image: b.image_url || 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
        }
      }));
    }

    // Fetch Services
    const { data: services } = await supabase.from('services').select('id, title, description, image_url').eq('is_active', true);
    if (services) {
      services.forEach(s => routes.push({
        route: `/services/${s.id}`,
        meta: {
          title: `${s.title} - Professional Yoga Services`,
          description: s.description ? s.description.substring(0, 160) : '',
          image: s.image_url || 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
        }
      }));
    }

    // Fetch YTTC Courses
    const { data: courses } = await supabase.from('courses').select('slug, title, description, image_url').eq('is_active', true);
    if (courses) {
      courses.forEach(c => routes.push({
        route: `/yttc/${c.slug}`,
        meta: {
          title: `${c.title} | YTTC Yoga Teacher Training`,
          description: c.description ? c.description.substring(0, 160) : '',
          image: c.image_url || 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
        }
      }));
    }

    // Fetch Trainers
    const { data: trainers } = await supabase.from('user_profiles').select('id, first_name, last_name, bio, avatar_url').eq('role', 'trainer');
    if (trainers) {
      trainers.forEach(t => {
        const name = `${t.first_name || ''} ${t.last_name || ''}`.trim();
        routes.push({
          route: `/trainer/${t.id}`,
          meta: {
            title: `${name} - Certified Yoga Trainer | YogaPatha`,
            description: t.bio || `Connect with ${name}, a certified yoga trainer at YogaPatha for personalized wellness programs.`,
            image: t.avatar_url || 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
          }
        });
      });
    }

    // Fetch Locations (States & Cities)
    const { data: states } = await supabase.from('states').select('id, slug, name, image').eq('is_active', true);
    if (states) {
      for (const state of states) {
        routes.push({
          route: `/locations/${state.slug}`,
          meta: {
            title: `Yoga & Fitness Trainers in ${state.name} | YogaPatha`,
            description: `Find certified yoga and fitness trainers in ${state.name}. Book professional trainers near you.`,
            image: state.image || 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
          }
        });
        
        const { data: cities } = await supabase.from('cities').select('slug, name').eq('state_id', state.id).eq('is_active', true);
        if (cities) {
          cities.forEach(c => {
            routes.push({
              route: `/locations/${state.slug}/${c.slug}`,
              meta: {
                title: `Yoga Teacher at Home in ${c.name}, ${state.name} | Personal & Online Yoga Classes`,
                description: `Find certified yoga teachers at home or online in ${c.name}, ${state.name}. Beginners, seniors, pre postnatal, therapy, weight loss available.`,
                image: 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
              }
            });
          });
        }
      }
    }

    fs.writeFileSync('routes.json', JSON.stringify(routes, null, 2));
    console.log(`Successfully generated routes.json with ${routes.length} paths and their metadata.`);
  } catch (error) {
    console.error('Failed to generate routes:', error);
    process.exit(1);
  }
}

generateRoutes();
