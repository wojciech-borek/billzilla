import type { SupabaseClient as RealSupabaseClient } from "@/db/supabase.client";
import type { Mock } from "vitest";
import type { AuthResponse, AuthError, User, Session, OAuthResponse, AuthOtpResponse } from "@/types";

/**
 * Mock Supabase client types for testing
 * These types represent the mock structure used in tests
 */

export interface MockSupabaseQueryBuilder {
  select: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  eq: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  neq: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  gt: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  gte: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  lt: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  lte: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  like: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  ilike: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  is: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  in: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  contains: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  containedBy: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  range: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  order: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  limit: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  single: Mock<() => Promise<{ data: unknown; error: unknown }>>;
  maybeSingle: Mock<() => Promise<{ data: unknown; error: unknown }>>;
  insert: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  upsert: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  update: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  delete: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  rpc: Mock<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  count: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  head: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  csv: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  explain: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  rollback: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  abortSignal: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  or: Mock<(...args: unknown[]) => MockSupabaseQueryBuilder>;
  then: Mock<(resolve?: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>>;
  catch: Mock<(onRejected?: (reason: unknown) => unknown) => Promise<unknown>>;
  finally: Mock<(onFinally?: () => void) => Promise<unknown>>;
}

export interface MockSupabaseAuthClient {
  signUp: Mock<(credentials: unknown, options?: unknown) => Promise<AuthResponse>>;
  signIn: Mock<(credentials: unknown, options?: unknown) => Promise<AuthResponse>>;
  signInWithPassword: Mock<(credentials: unknown) => Promise<AuthResponse>>;
  signInWithOAuth: Mock<(credentials: unknown) => Promise<OAuthResponse>>;
  signInWithIdToken: Mock<(credentials: unknown) => Promise<AuthResponse>>;
  signInAnonymously: Mock<() => Promise<AuthResponse>>;
  signOut: Mock<(options?: unknown) => Promise<{ error: AuthError | null }>>;
  resetPassword: Mock<(credentials: unknown) => Promise<{ data: unknown; error: unknown }>>;
  resetPasswordForEmail: Mock<(email: string, options?: unknown) => Promise<{ error: AuthError | null }>>;
  updateUser: Mock<(attributes: unknown, options?: unknown) => Promise<AuthResponse>>;
  setSession: Mock<(session: unknown) => Promise<AuthResponse>>;
  refreshSession: Mock<(options?: unknown) => Promise<AuthResponse>>;
  getSession: Mock<() => Promise<{ data: { session: Session | null }; error: AuthError | null }>>;
  getUser: Mock<(options?: unknown) => Promise<{ data: { user: User | null }; error: AuthError | null }>>;
  onAuthStateChange: Mock<
    (callback: unknown, options?: unknown) => { data: { subscription: { unsubscribe: Mock<() => void> } } }
  >;
  verifyOtp: Mock<(params: unknown) => Promise<AuthOtpResponse>>;
  resend: Mock<(params: unknown) => Promise<AuthOtpResponse>>;
}

export type MockSupabaseClient = RealSupabaseClient & {
  from: Mock<(table: string) => MockSupabaseQueryBuilder>;
  auth: MockSupabaseAuthClient;
  channel: Mock<(...args: unknown[]) => unknown>;
  removeChannel: Mock<(...args: unknown[]) => Promise<{ error: unknown }>>;
  removeAllChannels: Mock<() => Promise<{ error: unknown }>>;
  removeAllSubscriptions: Mock<() => Promise<{ error: unknown }>>;
  getChannels: Mock<() => unknown[]>;
  rest: {
    from: Mock<(table: string) => MockSupabaseQueryBuilder>;
  };
  realtime: {
    channel: Mock<(...args: unknown[]) => unknown>;
    removeChannel: Mock<(...args: unknown[]) => Promise<{ error: unknown }>>;
    removeAllChannels: Mock<() => Promise<{ error: unknown }>>;
    getChannels: Mock<() => unknown[]>;
  };
  storage: {
    from: Mock<(...args: unknown[]) => unknown>;
    createBucket: Mock<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    getBucket: Mock<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    listBuckets: Mock<() => Promise<{ data: unknown; error: unknown }>>;
    updateBucket: Mock<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    deleteBucket: Mock<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    emptyBucket: Mock<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  };
  functions: {
    invoke: Mock<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  };
} & MockSupabaseQueryBuilder;

/**
 * Type guard to check if a SupabaseClient is a mock
 */
export function isMockSupabaseClient(client: RealSupabaseClient): client is MockSupabaseClient {
  return (
    typeof (client as MockSupabaseClient).from === "function" &&
    typeof (client as MockSupabaseClient).from.mock === "object"
  );
}

/**
 * Utility type for creating mock responses
 */
export interface MockResponse<T = unknown> {
  data: T | null;
  error: unknown | null;
}

/**
 * Utility type for creating mock query results
 */
export interface MockQueryResult<T = unknown> extends MockResponse<T> {
  count?: number;
}

/**
 * Type-safe mock setup helpers
 */
export interface MockSetupConfig<T = unknown> {
  data?: T;
  error?: unknown;
  count?: number;
}

/**
 * Auth mock setup configuration
 */
export interface AuthMockSetupConfig {
  signUp?: AuthResponse;
  signIn?: AuthResponse;
  signOut?: { error: AuthError | null };
  resetPassword?: { data: unknown; error: unknown };
  resetPasswordForEmail?: { error: AuthError | null };
  updateUser?: AuthResponse;
  setSession?: AuthResponse;
  refreshSession?: AuthResponse;
  getSession?: { data: { session: Session | null }; error: AuthError | null };
  getUser?: { data: { user: User | null }; error: AuthError | null };
  verifyOtp?: AuthOtpResponse;
  resend?: AuthOtpResponse;
}
