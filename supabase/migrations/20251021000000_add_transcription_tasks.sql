-- =============================================
-- Transcription Tasks Table and Policies
-- =============================================
-- comment: Adds support for asynchronous audio transcription tasks
-- with AI-powered expense data extraction

-- =============================================
-- custom types (enums)
-- =============================================

create type public.transcription_task_status as enum ('processing', 'completed', 'failed');

-- =============================================
-- table creation
-- =============================================

-- table: transcription_tasks
-- comment: Stores transcription task state and results for async processing
create table public.transcription_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.transcription_task_status not null default 'processing',
  
  -- Audio storage (optional - can be temporary URL or null if deleted after processing)
  audio_url text,
  
  -- Processing results
  transcription_text text,
  result_data jsonb,
  
  -- Error tracking
  error_code text,
  error_message text,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  
  -- Constraints
  constraint transcription_text_when_completed 
    check (status != 'completed' or transcription_text is not null),
  constraint result_data_when_completed 
    check (status != 'completed' or result_data is not null),
  constraint error_when_failed 
    check (status != 'failed' or (error_code is not null and error_message is not null)),
  constraint completed_at_when_done 
    check (status = 'processing' or completed_at is not null)
);

-- =============================================
-- indexes
-- =============================================

-- Index for filtering by user and group
create index idx_transcription_tasks_user_id on public.transcription_tasks(user_id);
create index idx_transcription_tasks_group_id on public.transcription_tasks(group_id);

-- Index for filtering by status (useful for cleanup jobs)
create index idx_transcription_tasks_status on public.transcription_tasks(status);

-- Index for filtering by creation date (useful for cleanup of old tasks)
create index idx_transcription_tasks_created_at on public.transcription_tasks(created_at);

-- =============================================
-- row level security (rls)
-- =============================================

alter table public.transcription_tasks enable row level security;

-- Policy: Users can only read their own transcription tasks
create policy "Users can view their own transcription tasks"
  on public.transcription_tasks
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only create transcription tasks for groups they belong to
create policy "Users can create transcription tasks for their groups"
  on public.transcription_tasks
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members
      where group_id = transcription_tasks.group_id
        and profile_id = auth.uid()
        and status = 'active'
    )
  );

-- Policy: Users can update their own transcription tasks (for status updates from backend)
-- Note: This is primarily for backend service updates, but limited to task owner
create policy "Users can update their own transcription tasks"
  on public.transcription_tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own old transcription tasks
create policy "Users can delete their own transcription tasks"
  on public.transcription_tasks
  for delete
  using (auth.uid() = user_id);

-- =============================================
-- trigger for updated_at
-- =============================================

create or replace function public.update_transcription_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_transcription_tasks_updated_at
  before update on public.transcription_tasks
  for each row
  execute function public.update_transcription_tasks_updated_at();

-- =============================================
-- comments
-- =============================================

comment on table public.transcription_tasks is 'Stores asynchronous audio transcription tasks with AI expense extraction results';
comment on column public.transcription_tasks.id is 'Unique task identifier';
comment on column public.transcription_tasks.group_id is 'Group context for expense extraction';
comment on column public.transcription_tasks.user_id is 'User who created the transcription task';
comment on column public.transcription_tasks.status is 'Current task status: processing, completed, or failed';
comment on column public.transcription_tasks.audio_url is 'Optional temporary URL to audio file';
comment on column public.transcription_tasks.transcription_text is 'Text transcription from audio (Whisper output)';
comment on column public.transcription_tasks.result_data is 'Extracted expense data in JSON format (LLM output)';
comment on column public.transcription_tasks.error_code is 'Error code if task failed';
comment on column public.transcription_tasks.error_message is 'Error message if task failed';
comment on column public.transcription_tasks.created_at is 'Task creation timestamp';
comment on column public.transcription_tasks.updated_at is 'Last update timestamp';
comment on column public.transcription_tasks.completed_at is 'Task completion timestamp (success or failure)';

