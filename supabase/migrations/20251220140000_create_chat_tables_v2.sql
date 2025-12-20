-- Migration: Create conversations and chat_messages tables with nullable group_id
-- Description: Database schema for AI chat conversations and message history
-- Created: 2025-12-20

-- Create message type enum
CREATE TYPE message_type AS ENUM (
  'user_text',
  'ai_text',
  'ai_function_call',
  'ai_function_result',
  'ai_error',
  'system_info'
);

-- Create conversations table with nullable group_id
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,  -- NULL for global/dashboard conversations
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  type message_type NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_group_id ON conversations(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX idx_chat_messages_conversation_timestamp ON chat_messages(conversation_id, timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER conversations_updated_at_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
CREATE POLICY conversations_user_policy ON conversations
  FOR ALL
  USING (user_id = auth.uid());

-- Policy: Users can only see messages from their conversations
CREATE POLICY chat_messages_user_policy ON chat_messages
  FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Stores AI chat conversations between users and groups';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN conversations.user_id IS 'User who owns this conversation';
COMMENT ON COLUMN conversations.group_id IS 'Group context for this conversation (NULL for global/dashboard conversations)';
COMMENT ON COLUMN chat_messages.type IS 'Type of message (user, AI, function call, etc.)';
COMMENT ON COLUMN chat_messages.content IS 'Message content (string or object stored as JSONB)';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional metadata (function name, loading state, errors)';
