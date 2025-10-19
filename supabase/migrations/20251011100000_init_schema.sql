-- =============================================
-- custom types (enums)
-- =============================================
-- comment: Defines custom ENUM types for various status and role fields.

create type public.group_role as enum ('creator', 'member');
create type public.group_member_status as enum ('active', 'inactive');
create type public.invitation_status as enum ('pending', 'accepted', 'declined');
create type public.group_status as enum ('active', 'archived');


-- =============================================
-- tables creation
-- =============================================
-- comment: Create all tables first to resolve dependencies before creating policies.

-- table: currencies
create table public.currencies (
  code varchar(3) primary key,
  name text not null
);

-- table: profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  email text not null unique
);

-- table: groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  base_currency_code varchar(3) not null references public.currencies(code),
  status public.group_status not null default 'active'
);

-- table: group_members
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.group_role not null default 'member',
  status public.group_member_status not null default 'active',
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

-- table: group_currencies
create table public.group_currencies (
  group_id uuid not null references public.groups(id) on delete cascade,
  currency_code varchar(3) not null references public.currencies(code),
  exchange_rate numeric(10, 4) not null check (exchange_rate > 0),
  primary key (group_id, currency_code)
);

-- table: invitations
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email text not null,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- table: expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  payer_id uuid not null references public.profiles(id),
  description text not null,
  amount numeric(10, 2) not null check (amount > 0),
  currency_code varchar(3) not null references public.currencies(code),
  expense_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Add comment explaining the payer_id column
COMMENT ON COLUMN public.expenses.payer_id IS 'ID of the user who paid for this expense (can be different from created_by)';

-- table: expense_splits
create table public.expense_splits (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  primary key (expense_id, profile_id)
);

-- table: settlements
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer_id uuid not null references public.profiles(id),
  payee_id uuid not null references public.profiles(id),
  amount numeric(10, 2) not null check (amount > 0),
  settled_at timestamptz not null default now()
);


-- =============================================
-- enable rls
-- =============================================
-- comment: Enable row-level security for all tables.

alter table public.currencies enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_currencies enable row level security;
alter table public.invitations enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;


-- =============================================
-- indexes
-- =============================================
-- comment: Create indexes for performance.

create index on public.profiles (email);
create index on public.group_members (profile_id);
create index on public.group_currencies (currency_code);
create index on public.invitations (group_id);
create index on public.invitations (email);
create index on public.expenses (group_id);
create index on public.expenses (created_by);
create index on public.expenses (currency_code);
create index on public.expense_splits (profile_id);
create index on public.settlements (group_id);
create index on public.settlements (payer_id);
create index on public.settlements (payee_id);


-- =============================================
-- helper functions & triggers
-- =============================================
-- comment: Helper function to check group membership. Required for RLS policies.
create or replace function public.is_group_member(p_group_id uuid, p_profile_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id and gm.profile_id = p_profile_id and gm.status = 'active'
  );
end;
$$ language plpgsql security definer set search_path = '';

-- comment: Trigger function to create a profile entry when a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================================
-- rls policies
-- =============================================
-- comment: Define RLS policies for data access control now that all tables and helpers are created.

-- policies: currencies
create policy "allow_read_access_for_all" on public.currencies for select using (true);

-- policies: profiles
create policy "allow_read_own_and_fellow_group_members" on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid()) or
    exists (
      select 1
      from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.profile_id = (select auth.uid()) and gm2.profile_id = public.profiles.id
    )
  );
create policy "allow_update_own_profile" on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- policies: groups
create policy "allow_read_own_groups" on public.groups for select
  to authenticated
  using (is_group_member(id, (select auth.uid())));
create policy "allow_insert_for_authenticated" on public.groups for insert
  to authenticated
  with check (true);

-- policies: group_members
create policy "allow_read_for_group_members" on public.group_members for select
  to authenticated
  using (is_group_member(group_id, (select auth.uid())));

-- policies: group_currencies
create policy "allow_all_for_group_members" on public.group_currencies for all
  to authenticated
  using (is_group_member(group_id, (select auth.uid())))
  with check (is_group_member(group_id, (select auth.uid())));

-- policies: invitations
create policy "allow_read_for_group_members" on public.invitations for select
  to authenticated
  using (is_group_member(group_id, (select auth.uid())));

-- policies: expenses
create policy "allow_read_for_group_members" on public.expenses for select
  to authenticated
  using (is_group_member(group_id, (select auth.uid())));
create policy "allow_insert_for_group_members" on public.expenses for insert
  to authenticated
  with check (is_group_member(group_id, (select auth.uid())) or (select auth.uid()) is null); -- TEMP: Allow for development mock auth
create policy "allow_update_own_expenses" on public.expenses for update
  to authenticated
  using (created_by = (select auth.uid()) OR payer_id = (select auth.uid()))
  with check (created_by = (select auth.uid()) OR payer_id = (select auth.uid()));
create policy "allow_delete_own_expenses" on public.expenses for delete
  to authenticated
  using (created_by = (select auth.uid()) OR payer_id = (select auth.uid()));

-- policies: expense_splits
create policy "allow_all_for_group_members" on public.expense_splits for all
  to authenticated
  using (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_splits.expense_id and (is_group_member(expenses.group_id, (select auth.uid())) or (select auth.uid()) is null)
    )
  )
  with check (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_splits.expense_id and (is_group_member(expenses.group_id, (select auth.uid())) or (select auth.uid()) is null)
    )
  ); -- TEMP: Allow for development mock auth

-- policies: settlements
create policy "allow_all_for_group_members" on public.settlements for all
  to authenticated
  using (is_group_member(group_id, (select auth.uid())))
  with check (is_group_member(group_id, (select auth.uid())));
