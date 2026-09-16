-- ============================================================================
-- KrishiSetu — Supabase / PostgreSQL Database Schema
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "btree_gist";

-- ============================================================================
-- ENUMS
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'user_role'
  ) then
    create type user_role as enum ('farmer', 'buyer');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'quality_grade'
  ) then
    create type quality_grade as enum ('A', 'B', 'C');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'listing_status'
  ) then
    create type listing_status as enum ('active', 'sold', 'withdrawn');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'offer_status'
  ) then
    create type offer_status as enum (
      'pending',
      'countered',
      'accepted',
      'rejected',
      'completed'
    );
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'crop_category'
  ) then
    create type crop_category as enum (
      'Vegetable',
      'Grain',
      'Pulse',
      'Cash Crop',
      'Fruit'
    );
  end if;
end
$$;


-- ============================================================================
-- 1. PROFILES
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  role user_role not null,

  full_name text not null
    check (length(trim(full_name)) > 0),

  phone text not null
    check (phone ~ '^[0-9]{10}$'),

  location_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx
on public.profiles(role);


-- ============================================================================
-- 2. FARMER PROFILES
-- ============================================================================

create table if not exists public.farmer_profiles (
  profile_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  -- OPTIONAL
  farmer_id_url text,

  farmer_id_verified boolean not null default false,

  created_at timestamptz not null default now()
);


-- ============================================================================
-- 3. BUYER PROFILES
-- ============================================================================

create table if not exists public.buyer_profiles (
  profile_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  company_name text not null
    check (length(trim(company_name)) > 0),

  business_type text,

  gstin text,

  business_address text,

  created_at timestamptz not null default now()
);


-- ============================================================================
-- 4. LISTINGS
-- ============================================================================

create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),

  farmer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  crop_name text not null,

  crop_category crop_category not null,

  quantity_quintals numeric(10,2) not null
    check (
      quantity_quintals > 0
      and quantity_quintals <= 10000
    ),

  price_per_quintal numeric(10,2) not null
    check (price_per_quintal > 0),

  location_id text not null,

  grade quality_grade not null,

  status listing_status not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_farmer_idx
on public.listings(farmer_id);

create index if not exists listings_filter_idx
on public.listings(
  status,
  crop_name,
  location_id,
  grade
);

create index if not exists listings_price_idx
on public.listings(price_per_quintal);


-- ============================================================================
-- 5. OFFERS
-- ============================================================================

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),

  listing_id uuid not null
    references public.listings(id)
    on delete cascade,

  buyer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  farmer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  buyer_company text not null,

  quantity_quintals numeric(10,2) not null
    check (quantity_quintals > 0),

  offer_price numeric(10,2) not null
    check (offer_price > 0),

  counter_price numeric(10,2)
    check (counter_price > 0),

  message text,

  status offer_status not null default 'pending',

  final_grade quality_grade,

  final_price numeric(10,2)
    check (final_price > 0),

  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index if not exists offers_buyer_idx
on public.offers(buyer_id);

create index if not exists offers_farmer_idx
on public.offers(farmer_id);

create index if not exists offers_listing_idx
on public.offers(listing_id);

create index if not exists offers_status_idx
on public.offers(status);


-- Prevent duplicate active offers
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'one_live_offer_per_listing_per_buyer'
  ) then

    alter table public.offers
    add constraint one_live_offer_per_listing_per_buyer
    exclude using gist (
      listing_id with =,
      buyer_id with =
    )
    where (
      status in ('pending', 'countered')
    );

  end if;
end
$$;


-- ============================================================================
-- 6. RATINGS
-- ============================================================================

create table if not exists public.ratings (
  id uuid primary key default uuid_generate_v4(),

  offer_id uuid not null unique
    references public.offers(id)
    on delete cascade,

  farmer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  buyer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  stars smallint not null
    check (stars between 1 and 5),

  comment text
    check (
      comment is null
      or length(comment) <= 500
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ratings_farmer_idx
on public.ratings(farmer_id);


-- ============================================================================
-- RATING INTEGRITY
-- ============================================================================

create or replace function public.enforce_rating_is_earned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers%rowtype;
begin

  select *
  into v_offer
  from public.offers
  where id = new.offer_id;

  if not found then
    raise exception 'Rating must reference an existing offer';
  end if;

  if v_offer.status <> 'completed' then
    raise exception 'Cannot rate: purchase is not completed';
  end if;

  if v_offer.buyer_id <> new.buyer_id then
    raise exception
      'Cannot rate: you were not the buyer on this purchase';
  end if;

  if v_offer.farmer_id <> new.farmer_id then
    raise exception
      'Cannot rate: this farmer was not the seller on this purchase';
  end if;

  return new;

end;
$$;


drop trigger if exists ratings_must_be_earned
on public.ratings;

create trigger ratings_must_be_earned
before insert or update
on public.ratings
for each row
execute function public.enforce_rating_is_earned();


-- ============================================================================
-- FARMER RATING SUMMARY
-- ============================================================================

create or replace view public.farmer_rating_summary as
select
  farmer_id,
  round(avg(stars)::numeric, 1) as average_stars,
  count(*) as rating_count
from public.ratings
group by farmer_id;


-- ============================================================================
-- UPDATED_AT
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


drop trigger if exists profiles_touch
on public.profiles;

create trigger profiles_touch
before update
on public.profiles
for each row
execute function public.touch_updated_at();


drop trigger if exists listings_touch
on public.listings;

create trigger listings_touch
before update
on public.listings
for each row
execute function public.touch_updated_at();


drop trigger if exists offers_touch
on public.offers;

create trigger offers_touch
before update
on public.offers
for each row
execute function public.touch_updated_at();


drop trigger if exists ratings_touch
on public.ratings;

create trigger ratings_touch
before update
on public.ratings
for each row
execute function public.touch_updated_at();


-- ============================================================================
-- ROLE IMMUTABILITY
-- ============================================================================

create or replace function public.block_role_change()
returns trigger
language plpgsql
as $$
begin

  if new.role <> old.role then
    raise exception 'Role cannot be changed after signup';
  end if;

  return new;

end;
$$;


drop trigger if exists profiles_role_immutable
on public.profiles;

create trigger profiles_role_immutable
before update
on public.profiles
for each row
execute function public.block_role_change();


-- ============================================================================
-- CURRENT USER ROLE
-- ============================================================================

create or replace function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles
enable row level security;

alter table public.farmer_profiles
enable row level security;

alter table public.buyer_profiles
enable row level security;

alter table public.listings
enable row level security;

alter table public.offers
enable row level security;

alter table public.ratings
enable row level security;


-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

drop policy if exists "profiles readable by authenticated users"
on public.profiles;

create policy "profiles readable by authenticated users"
on public.profiles
for select
using (
  auth.role() = 'authenticated'
);


drop policy if exists "users insert only their own profile"
on public.profiles;

create policy "users insert only their own profile"
on public.profiles
for insert
with check (
  id = auth.uid()
);


drop policy if exists "users update only their own profile"
on public.profiles;

create policy "users update only their own profile"
on public.profiles
for update
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);


-- ============================================================================
-- FARMER PROFILE POLICIES
-- ============================================================================

drop policy if exists "own farmer profile - read"
on public.farmer_profiles;

create policy "own farmer profile - read"
on public.farmer_profiles
for select
using (
  profile_id = auth.uid()
);


drop policy if exists "own farmer profile - write"
on public.farmer_profiles;

create policy "own farmer profile - write"
on public.farmer_profiles
for all
using (
  profile_id = auth.uid()
)
with check (
  profile_id = auth.uid()
);


-- ============================================================================
-- BUYER PROFILE POLICIES
-- ============================================================================

drop policy if exists "buyer profiles readable"
on public.buyer_profiles;

create policy "buyer profiles readable"
on public.buyer_profiles
for select
using (
  auth.role() = 'authenticated'
);


drop policy if exists "own buyer profile - write"
on public.buyer_profiles;

create policy "own buyer profile - write"
on public.buyer_profiles
for all
using (
  profile_id = auth.uid()
)
with check (
  profile_id = auth.uid()
);


-- ============================================================================
-- LISTINGS POLICIES
-- ============================================================================

drop policy if exists "active listings are public"
on public.listings;

create policy "active listings are public"
on public.listings
for select
using (
  status = 'active'
  or farmer_id = auth.uid()
);


drop policy if exists "only farmers create listings, only for themselves"
on public.listings;

create policy "only farmers create listings, only for themselves"
on public.listings
for insert
with check (
  farmer_id = auth.uid()
  and public.current_role() = 'farmer'
);


drop policy if exists "farmers update only their own listings"
on public.listings;

create policy "farmers update only their own listings"
on public.listings
for update
using (
  farmer_id = auth.uid()
)
with check (
  farmer_id = auth.uid()
);


drop policy if exists "farmers delete only their own listings"
on public.listings;

create policy "farmers delete only their own listings"
on public.listings
for delete
using (
  farmer_id = auth.uid()
);


-- ============================================================================
-- OFFERS POLICIES
-- ============================================================================

drop policy if exists "offers visible to the two parties"
on public.offers;

create policy "offers visible to the two parties"
on public.offers
for select
using (
  buyer_id = auth.uid()
  or farmer_id = auth.uid()
);


drop policy if exists "only buyers create offers, only as themselves"
on public.offers;

create policy "only buyers create offers, only as themselves"
on public.offers
for insert
with check (
  buyer_id = auth.uid()
  and public.current_role() = 'buyer'
);


drop policy if exists "either party may update the offer they are on"
on public.offers;

create policy "either party may update the offer they are on"
on public.offers
for update
using (
  buyer_id = auth.uid()
  or farmer_id = auth.uid()
);


-- ============================================================================
-- RATINGS POLICIES
-- ============================================================================

drop policy if exists "ratings are publicly readable"
on public.ratings;

create policy "ratings are publicly readable"
on public.ratings
for select
using (
  true
);


drop policy if exists "only the buyer on the purchase may rate"
on public.ratings;

create policy "only the buyer on the purchase may rate"
on public.ratings
for insert
with check (
  buyer_id = auth.uid()
  and public.current_role() = 'buyer'
);


drop policy if exists "buyers may edit only their own rating"
on public.ratings;

create policy "buyers may edit only their own rating"
on public.ratings
for update
using (
  buyer_id = auth.uid()
)
with check (
  buyer_id = auth.uid()
);


drop policy if exists "buyers may delete only their own rating"
on public.ratings;

create policy "buyers may delete only their own rating"
on public.ratings
for delete
using (
  buyer_id = auth.uid()
);


-- ============================================================================
-- DONE
-- ============================================================================