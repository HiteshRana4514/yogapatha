-- Insert initial data for Footer About & Social Section
INSERT INTO site_content (page_name, section_name, content)
VALUES (
    'global', 
    'footer_about', 
    '{
        "description": "Transform your fitness journey with expert trainers, personalized programs, and a supportive community dedicated to helping you achieve your goals.",
        "social_links": [
            {"platform": "Facebook", "url": "#", "icon": "Facebook"},
            {"platform": "Instagram", "url": "#", "icon": "Instagram"},
            {"platform": "Twitter", "url": "#", "icon": "Twitter"},
            {"platform": "YouTube", "url": "#", "icon": "Youtube"}
        ]
    }'::jsonb
) ON CONFLICT (page_name, section_name) DO NOTHING;

-- Insert initial data for Footer Links Section (Quick Links & Services)
INSERT INTO site_content (page_name, section_name, content)
VALUES (
    'global', 
    'footer_links', 
    '{
        "quick_links": {
            "title": "Quick Links",
            "links": [
                {"label": "Home", "url": "/"},
                {"label": "About Us", "url": "/about"},
                {"label": "Services", "url": "/services"},
                {"label": "Find Trainers", "url": "/find-trainers"},
                {"label": "Pricing", "url": "/pricing"},
                {"label": "Contact", "url": "/contact"}
            ]
        },
        "services_links": {
            "title": "Our Services",
            "links": [
                {"label": "Strength Training", "url": "/services/strength", "icon": "Dumbbell"},
                {"label": "Cardio Fitness", "url": "/services/cardio", "icon": "Heart"},
                {"label": "Personal Coaching", "url": "/services/personal", "icon": "Target"},
                {"label": "Group Training", "url": "/services/group", "icon": "Users"},
                {"label": "Nutrition Guidance", "url": "/services/nutrition"},
                {"label": "Online Training", "url": "/services/online"}
            ]
        }
    }'::jsonb
) ON CONFLICT (page_name, section_name) DO NOTHING;

-- Insert initial data for Footer Contact Section
INSERT INTO site_content (page_name, section_name, content)
VALUES (
    'global', 
    'footer_contact', 
    '{
        "title": "Contact Info",
        "address": "123 Fitness Street, Wellness District, City, State 12345",
        "phone": "+1 (234) 567-8900",
        "email": "info@fitnesscompany.com",
        "hours": [
            "Mon - Fri: 6:00 AM - 10:00 PM",
            "Sat - Sun: 7:00 AM - 9:00 PM"
        ]
    }'::jsonb
) ON CONFLICT (page_name, section_name) DO NOTHING;

-- Insert initial data for Footer Newsletter Section
INSERT INTO site_content (page_name, section_name, content)
VALUES (
    'global', 
    'footer_newsletter', 
    '{
        "title": "Stay Updated",
        "description": "Subscribe to our newsletter for fitness tips, exclusive offers, and updates on new training programs.",
        "button_text": "Subscribe",
        "placeholder": "Enter your email"
    }'::jsonb
) ON CONFLICT (page_name, section_name) DO NOTHING;

-- Insert initial data for Footer Bottom Section
INSERT INTO site_content (page_name, section_name, content)
VALUES (
    'global', 
    'footer_bottom', 
    '{
        "copyright": "© 2024 Fitness Company. All rights reserved.",
        "links": [
            {"label": "Privacy Policy", "url": "/privacy"},
            {"label": "Terms of Service", "url": "/terms"},
            {"label": "Cookie Policy", "url": "/cookies"},
            {"label": "Sitemap", "url": "/sitemap"}
        ]
    }'::jsonb
) ON CONFLICT (page_name, section_name) DO NOTHING;
