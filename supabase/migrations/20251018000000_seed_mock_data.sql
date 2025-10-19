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
  ('00000000-0000-0000-0000-000000000000', '0d1dd762-53a4-45dd-84b6-9de0bf109f44', 'authenticated', 'authenticated', 'john.doe@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL),
  ('00000000-0000-0000-0000-000000000000', 'cecae25c-ecec-4e42-81f7-1fca4353b554', 'authenticated', 'authenticated', 'jane.smith@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL),
  ('00000000-0000-0000-0000-000000000000', 'afef22d7-4c93-4881-b903-0b113b925d50', 'authenticated', 'authenticated', 'alice.johnson@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL),
  ('00000000-0000-0000-0000-000000000000', '0d1dd762-53a4-45dd-84b6-9de0bf109f45', 'authenticated', 'authenticated', 'bob.brown@example.com', crypt('password123', gen_salt('bf')), NULL, NOW(), NULL);

-- Now insert into profiles using the same IDs, with conflict handling
INSERT INTO profiles (id, full_name, email, avatar_url, updated_at) VALUES
  ('0d1dd762-53a4-45dd-84b6-9de0bf109f44', 'John Doe', 'john.doe@example.com', 'https://picsum.photos/seed/john/200/200', NOW()),
  ('cecae25c-ecec-4e42-81f7-1fca4353b554', 'Jane Smith', 'jane.smith@example.com', 'https://picsum.photos/seed/jane/200/200', NOW()),
  ('afef22d7-4c93-4881-b903-0b113b925d50', 'Alice Johnson', 'alice.johnson@example.com', 'https://picsum.photos/seed/alice/200/200', NOW()),
  ('0d1dd762-53a4-45dd-84b6-9de0bf109f45', 'Bob Brown', 'bob.brown@example.com', 'https://picsum.photos/seed/bob/200/200', NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = EXCLUDED.updated_at;

-- Insert sample groups into groups table
INSERT INTO groups (id, name, base_currency_code, status, created_at) VALUES
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'Test Group', 'PLN', 'active', NOW()),  -- Test group with 3 members
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', 'My Awesome Project', 'EUR', 'active', NOW() - INTERVAL '3 days'),  -- Group where John Doe is creator
  ('cc8fc7ef-f8ff-469c-8f9d-869ecb0df9fe', 'Weekend Trip', 'USD', 'active', NOW() - INTERVAL '1 week');  -- Group with pending invitations

-- Insert sample group members into group_members table
INSERT INTO group_members (group_id, profile_id, role, status, joined_at) VALUES
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', '0d1dd762-53a4-45dd-84b6-9de0bf109f45', 'creator', 'active', NOW()),  -- Bob Brown is creator of Test Group
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', '0d1dd762-53a4-45dd-84b6-9de0bf109f44', 'member', 'active', NOW()),   -- John Doe is member of Test Group
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'cecae25c-ecec-4e42-81f7-1fca4353b554', 'member', 'active', NOW()),  -- Jane Smith is member of Test Group
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'afef22d7-4c93-4881-b903-0b113b925d50', 'member', 'active', NOW()),   -- Alice Johnson is member of Test Group
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', '0d1dd762-53a4-45dd-84b6-9de0bf109f44', 'creator', 'active', NOW() - INTERVAL '3 days'),  -- John Doe is creator of My Awesome Project
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', 'cecae25c-ecec-4e42-81f7-1fca4353b554', 'member', 'active', NOW() - INTERVAL '2 days');  -- Jane Smith is member of My Awesome Project

-- Insert sample group currencies into group_currencies table
-- Each group should have its base currency with exchange rate 1.0
INSERT INTO group_currencies (group_id, currency_code, exchange_rate) VALUES
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'PLN', 1.0),  -- Test Group base currency
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'EUR', 4.5),  -- Test Group additional currency
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'USD', 4.1),   -- Test Group additional currency
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', 'EUR', 1.0),  -- My Awesome Project base currency
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', 'PLN', 0.22), -- My Awesome Project additional currency
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', 'USD', 1.08), -- My Awesome Project additional currency
  ('cc8fc7ef-f8ff-469c-8f9d-869ecb0df9fe', 'USD', 1.0),  -- Weekend Trip base currency
  ('cc8fc7ef-f8ff-469c-8f9d-869ecb0df9fe', 'EUR', 0.92), -- Weekend Trip additional currency
  ('cc8fc7ef-f8ff-469c-8f9d-869ecb0df9fe', 'PLN', 0.24); -- Weekend Trip additional currency

-- Insert sample invitations
INSERT INTO invitations (group_id, email, status, created_at) VALUES
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'john.doe@example.com', 'pending', NOW() - INTERVAL '1 day'),  -- John has invitation to Test Group
  ('cc8fc7ef-f8ff-469c-8f9d-869ecb0df9fe', 'john.doe@example.com', 'pending', NOW() - INTERVAL '2 hours'), -- John has invitation to Weekend Trip
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', 'alice.johnson@example.com', 'pending', NOW() - INTERVAL '1 day'), -- Alice invited to My Awesome Project
  ('bb9fc6ef-f7ff-468c-8f9c-868ecb0df8fd', 'bob.brown@example.com', 'pending', NOW() - INTERVAL '2 days'), -- Bob invited to My Awesome Project
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'charlie.wilson@example.com', 'pending', NOW() - INTERVAL '2 days'),
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'diana.prince@example.com', 'pending', NOW() - INTERVAL '1 day'),
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'eve.garcia@example.com', 'accepted', NOW() - INTERVAL '5 days'),
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'frank.miller@example.com', 'declined', NOW() - INTERVAL '3 days'),
  ('ee8fc5ef-f6ff-467c-8f9b-867ecb0df7fc', 'grace.lee@example.com', 'pending', NOW() - INTERVAL '6 hours');