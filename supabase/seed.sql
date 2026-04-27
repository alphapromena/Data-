-- Sample seed data for local development.
-- Safe to re-run; uses ON CONFLICT DO NOTHING.

insert into public.clients (id, name_en, name_ar, industry, country_code, contact_email, stage)
values
    ('00000000-0000-0000-0000-000000000001', 'AlphaPro Demo Bank',  'بنك ألفا برو التجريبي',     'banking',    'SA', 'demo-bank@alphapro.sa',    'scan'),
    ('00000000-0000-0000-0000-000000000002', 'AlphaPro Demo Telco', 'شركة ألفا برو للاتصالات',  'telecom',    'SA', 'demo-telco@alphapro.sa',   'monitor')
on conflict (id) do nothing;
