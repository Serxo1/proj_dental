-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create schemas
create schema if not exists auth;
create schema if not exists storage;


-- Grant privileges
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;

-- Create tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('admin', 'dentist', 'assistant', 'receptionist')) not null default 'dentist',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.patients (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text unique,
  phone text,
  birth_date date,
  address text,
  medical_history text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients on delete cascade not null,
  dentist_id uuid references public.profiles on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('scheduled', 'confirmed', 'completed', 'cancelled')) not null default 'scheduled',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  duration interval not null,
  price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.inventory (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  quantity integer not null default 0,
  unit text not null,
  min_quantity integer not null default 0,
  price decimal(10,2) not null,
  supplier text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients on delete set null,
  type text check (type in ('income', 'expense')) not null,
  amount decimal(10,2) not null,
  description text,
  payment_method text check (payment_method in ('cash', 'credit_card', 'debit_card', 'pix', 'transfer')) not null,
  status text check (status in ('pending', 'completed', 'cancelled')) not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.services enable row level security;
alter table public.inventory enable row level security;
alter table public.transactions enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Patients policies
create policy "Patients are viewable by authenticated users"
  on public.patients for select
  to authenticated
  using (true);

create policy "Patients can be created by authenticated users"
  on public.patients for insert
  to authenticated
  with check (true);

create policy "Patients can be updated by authenticated users"
  on public.patients for update
  to authenticated
  using (true);

-- Appointments policies
create policy "Appointments are viewable by authenticated users"
  on public.appointments for select
  to authenticated
  using (true);

create policy "Appointments can be created by authenticated users"
  on public.appointments for insert
  to authenticated
  with check (true);

create policy "Appointments can be updated by authenticated users"
  on public.appointments for update
  to authenticated
  using (true);

-- Services policies
create policy "Services are viewable by everyone"
  on public.services for select
  using (true);

create policy "Services can be managed by authenticated users"
  on public.services for all
  to authenticated
  using (true);

-- Inventory policies
create policy "Inventory is viewable by authenticated users"
  on public.inventory for select
  to authenticated
  using (true);

create policy "Inventory can be managed by authenticated users"
  on public.inventory for all
  to authenticated
  using (true);

-- Transactions policies
create policy "Transactions are viewable by authenticated users"
  on public.transactions for select
  to authenticated
  using (true);

create policy "Transactions can be created by authenticated users"
  on public.transactions for insert
  to authenticated
  with check (true);

create policy "Transactions can be updated by authenticated users"
  on public.transactions for update
  to authenticated
  using (true);

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'dentist')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes
create index if not exists appointments_patient_id_idx on public.appointments(patient_id);
create index if not exists appointments_dentist_id_idx on public.appointments(dentist_id);
create index if not exists appointments_start_time_idx on public.appointments(start_time);
create index if not exists patients_email_idx on public.patients(email);
create index if not exists inventory_name_idx on public.inventory(name);
create index if not exists transactions_patient_id_idx on public.transactions(patient_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at); 