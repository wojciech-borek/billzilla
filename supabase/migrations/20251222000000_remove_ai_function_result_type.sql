-- Migration: Remove ai_function_result from message_type enum
-- Date: 2025-12-22
-- Description: Removes 'ai_function_result' from message types as chat is now text-only

-- First, delete any chat_messages with ai_function_result type
-- as we are deprecating this type and it's no longer compatible
DELETE FROM chat_messages WHERE type = 'ai_function_result';

-- Step 1: Create new enum type without ai_function_result
CREATE TYPE message_type_new AS ENUM (
  'user_text',
  'ai_text',
  'ai_function_call',
  'ai_error',
  'system_info'
);

-- Step 2: Alter the column to use the new type
ALTER TABLE chat_messages 
  ALTER COLUMN type TYPE message_type_new 
  USING type::text::message_type_new;

-- Step 3: Drop old enum type
DROP TYPE message_type;

-- Step 4: Rename new type to original name
ALTER TYPE message_type_new RENAME TO message_type;

-- Add comment explaining the change
COMMENT ON TYPE message_type IS 'Message types for chat system. ai_function_result removed in favor of text-only responses.';
