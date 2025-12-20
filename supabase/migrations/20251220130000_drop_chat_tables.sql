-- Migration: Drop existing chat tables and types
-- Description: Clean up any existing chat-related database objects
-- Created: 2025-12-20

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop type
DROP TYPE IF EXISTS message_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_conversations_updated_at() CASCADE;

-- Drop indexes (if they weren't dropped with tables)
DROP INDEX IF EXISTS idx_conversations_user_id;
DROP INDEX IF EXISTS idx_conversations_group_id;
DROP INDEX IF EXISTS idx_conversations_created_at;
DROP INDEX IF EXISTS idx_conversations_user_group;
DROP INDEX IF EXISTS idx_chat_messages_conversation_id;
DROP INDEX IF EXISTS idx_chat_messages_timestamp;
DROP INDEX IF EXISTS idx_chat_messages_conversation_timestamp;
