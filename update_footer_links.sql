UPDATE site_content 
SET content = jsonb_set(
    content, 
    '{links}', 
    '[{"label": "Privacy Policy", "url": "/privacy-policy"}, {"label": "Terms of Service", "url": "/terms-and-conditions"}, {"label": "Cookie Policy", "url": "#"}, {"label": "Sitemap", "url": "#"}]'::jsonb
)
WHERE page_name = 'global' AND section_name = 'footer_bottom';
