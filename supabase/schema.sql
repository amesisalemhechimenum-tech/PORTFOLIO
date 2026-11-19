-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  service text default '',
  budget text default '',
  timeline text default '',
  message text not null,
  read boolean not null default false,
  reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon text not null default 'bi-code-slash',
  features text[] not null default '{}',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;
alter table public.portfolio_services enable row level security;

-- Public visitors may submit enquiries but may not read or change them.
drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries" on public.enquiries for insert to anon, authenticated
  with check (length(trim(name)) > 0 and length(trim(email)) > 3 and length(trim(message)) > 0);

-- Only authenticated admin users can read/update/delete enquiries.
drop policy if exists "Admins can manage enquiries" on public.enquiries;
create policy "Admins can manage enquiries" on public.enquiries for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- Visitors can only read published services. Admin users manage the catalogue.
drop policy if exists "Public can view published services" on public.portfolio_services;
create policy "Public can view published services" on public.portfolio_services for select to anon, authenticated
  using (published = true or auth.uid() is not null);
drop policy if exists "Admins can manage services" on public.portfolio_services;
create policy "Admins can manage services" on public.portfolio_services for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists services_sort_order_idx on public.portfolio_services (sort_order);

-- Seed the six services already shown in the original portfolio so they can
-- immediately be managed from Admin → Services.
insert into public.portfolio_services (id,title,description,icon,features,published,sort_order)
select v.id::uuid,v.title,v.description,v.icon,v.features,true,v.sort_order
from (values
 ('10000000-0000-4000-8000-000000000001','Business Websites','Professional websites designed to give businesses a strong online presence, communicate their value and make it easier for customers to connect with them.','bi-building',array['Professional business layout','Mobile-friendly design','Clear calls to action','Contact sections'],1),
 ('10000000-0000-4000-8000-000000000002','Landing Pages','Focused landing pages created to introduce an offer, promote a product, collect leads or guide visitors toward a specific action.','bi-window-stack',array['Conversion-focused structure','Strong visual hierarchy','Responsive presentation','Clear call-to-action sections'],2),
 ('10000000-0000-4000-8000-000000000003','Portfolio Websites','Personal portfolio websites that present your skills, projects, experience and personality in a professional way.','bi-person-badge-fill',array['Personal branding','Project showcase','Skills presentation','Responsive design'],3),
 ('10000000-0000-4000-8000-000000000004','Personal Websites','A simple and memorable online home for creators, students, professionals and individuals who want to establish their digital identity.','bi-globe2',array['Personal introduction','About and contact sections','Social links','Mobile optimization'],4),
 ('10000000-0000-4000-8000-000000000005','Responsive Web Design','Websites carefully designed to provide a smooth experience across smartphones, tablets, laptops and larger screens.','bi-phone',array['Mobile-first thinking','Flexible layouts','Touch-friendly interfaces','Cross-screen consistency'],5),
 ('10000000-0000-4000-8000-000000000006','Website Improvements','Helping improve existing websites by making their layout cleaner, experience smoother and presentation more modern.','bi-magic',array['Layout improvements','Mobile improvements','Visual refinement','User experience improvements'],6)
) as v(id,title,description,icon,features,sort_order)
where not exists (select 1 from public.portfolio_services);
