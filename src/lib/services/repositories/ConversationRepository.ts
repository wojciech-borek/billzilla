/**
 * Conversation Repository
 *
 * Handles database operations for conversations and chat messages
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { ChatMessage, ConversationMetadata } from "@/lib/ai/chatTypes";
// import { generateMessageId } from "@/lib/ai/chatUtils";

/**
 * Repository for managing conversations and messages
 */
export class ConversationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Creates a new conversation for a user in a group
   */
  async createConversation(userId: string, groupId: string | null): Promise<ConversationMetadata> {
    const { data, error } = await this.supabase
      .from("conversations")
      .insert({
        user_id: userId,
        group_id: groupId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      group_id: data.group_id,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  /**
   * Retrieves a conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationMetadata | null> {
    const { data, error } = await this.supabase.from("conversations").select("*").eq("id", conversationId).single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      group_id: data.group_id,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  /**
   * Gets or creates a conversation for a user in a group
   */
  async getOrCreateConversation(userId: string, groupId: string | null): Promise<ConversationMetadata> {
    // Try to find existing conversation
    let query = this.supabase.from("conversations").select("*").eq("user_id", userId);

    // Handle null group_id differently
    if (groupId === null) {
      query = query.is("group_id", null);
    } else {
      query = query.eq("group_id", groupId);
    }

    const { data: existing } = await query.single();

    if (existing) {
      return {
        id: existing.id,
        user_id: existing.user_id,
        group_id: existing.group_id,
        created_at: new Date(existing.created_at),
        updated_at: new Date(existing.updated_at),
      };
    }

    // Create new conversation if not found
    return this.createConversation(userId, groupId);
  }

  /**
   * Adds a message to a conversation
   */
  async addMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const { error } = await this.supabase.from("chat_messages").insert({
      id: message.id,
      conversation_id: conversationId,
      type: message.type,
      content: message.content,
      metadata: message.metadata || null,
      timestamp: message.timestamp.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    // Update conversation's updated_at timestamp
    await this.supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  }

  /**
   * Retrieves message history for a conversation
   */
  async getMessageHistory(conversationId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get message history: ${error.message}`);
    }

    return data.map((row) => ({
      id: row.id,
      type: row.type,
      content: row.content,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata || undefined,
    }));
  }

  /**
   * Deletes a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<void> {
    // Messages will be deleted automatically via CASCADE
    const { error } = await this.supabase.from("conversations").delete().eq("id", conversationId);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  /**
   * Gets all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ConversationMetadata[]> {
    const { data, error } = await this.supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get user conversations: ${error.message}`);
    }

    return data.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      group_id: row.group_id,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }));
  }

  /**
   * Gets the message count for a conversation
   */
  async getMessageCount(conversationId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    if (error) {
      throw new Error(`Failed to get message count: ${error.message}`);
    }

    return count || 0;
  }
}
