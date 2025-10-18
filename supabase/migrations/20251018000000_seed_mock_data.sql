-- =============================================
-- Mock data for development
-- =============================================
-- This migration adds mock data for development purposes
-- TODO: Remove this migration in production


INSERT INTO public.currencies (code, name)
VALUES 
  ('PLN', 'Polski Złoty'),
  ('EUR', 'Euro'),
  ('USD', 'Dolar amerykański'),
  ('GBP', 'Funt szterling')
ON CONFLICT (code) DO NOTHING;

-- Insert sample users into auth.users table first
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, confirmation_token, email_confirmed_at, recovery_token) VALUES
  ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'john.doe@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL),
  ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'jane.smith@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL),
  ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'alice.johnson@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL),
  ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'bob.brown@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL);

-- Now insert into profiles using the same IDs, with conflict handling
INSERT INTO profiles (id, full_name, email, updated_at) VALUES
  ((SELECT id FROM auth.users WHERE email = 'john.doe@example.com' ORDER BY created_at LIMIT 1), 'John Doe', 'john.doe@example.com', NOW()),
  ((SELECT id FROM auth.users WHERE email = 'jane.smith@example.com' ORDER BY created_at LIMIT 1), 'Jane Smith', 'jane.smith@example.com', NOW()),
  ((SELECT id FROM auth.users WHERE email = 'alice.johnson@example.com' ORDER BY created_at LIMIT 1), 'Alice Johnson', 'alice.johnson@example.com', NOW()),
  ((SELECT id FROM auth.users WHERE email = 'bob.brown@example.com' ORDER BY created_at LIMIT 1), 'Bob Brown', 'bob.brown@example.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample groups into groups table
INSERT INTO groups (id, name, base_currency_code, status, created_at) VALUES
  (uuid_generate_v4(), 'Group A', 'USD', 'active', NOW()),  -- Group with 1 member
  (uuid_generate_v4(), 'Group B', 'EUR', 'active', NOW()),  -- Group with 2 members
  (uuid_generate_v4(), 'Group C', 'PLN', 'active', NOW());  -- Group with 3 members

-- Insert sample group members into group_members table
-- Assuming the first user is the creator for each group, using email for reliability
INSERT INTO group_members (group_id, profile_id, role, status, joined_at) VALUES
  ((SELECT id FROM groups WHERE name = 'Group A' ORDER BY created_at LIMIT 1), (SELECT id FROM profiles WHERE email = 'john.doe@example.com' LIMIT 1), 'creator', 'active', NOW()),  -- 1 member
  ((SELECT id FROM groups WHERE name = 'Group B' ORDER BY created_at LIMIT 1), (SELECT id FROM profiles WHERE email = 'jane.smith@example.com' LIMIT 1), 'creator', 'active', NOW()),
  ((SELECT id FROM groups WHERE name = 'Group B' ORDER BY created_at LIMIT 1), (SELECT id FROM profiles WHERE email = 'alice.johnson@example.com' LIMIT 1), 'member', 'active', NOW()),  -- 2 members
  ((SELECT id FROM groups WHERE name = 'Group C' ORDER BY created_at LIMIT 1), (SELECT id FROM profiles WHERE email = 'bob.brown@example.com' LIMIT 1), 'creator', 'active', NOW()),
  ((SELECT id FROM groups WHERE name = 'Group C' ORDER BY created_at LIMIT 1), (SELECT id FROM profiles WHERE email = 'john.doe@example.com' LIMIT 1), 'member', 'active', NOW()),
  ((SELECT id FROM groups WHERE name = 'Group C' ORDER BY created_at LIMIT 1), (SELECT id FROM profiles WHERE email = 'jane.smith@example.com' LIMIT 1), 'member', 'active', NOW());  -- 3 members

-- Insert sample invitations into invitations table
INSERT INTO invitations (id, group_id, email, status, created_at) VALUES
  (uuid_generate_v4(), (SELECT id FROM groups WHERE name = 'Group A' ORDER BY created_at LIMIT 1), 'newuser1@example.com', 'pending', NOW()),
  (uuid_generate_v4(), (SELECT id FROM groups WHERE name = 'Group B' ORDER BY created_at LIMIT 1), 'newuser2@example.com', 'pending', NOW()),
  (uuid_generate_v4(), (SELECT id FROM groups WHERE name = 'Group C' ORDER BY created_at LIMIT 1), 'newuser3@example.com', 'pending', NOW());