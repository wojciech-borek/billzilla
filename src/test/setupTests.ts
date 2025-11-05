import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock environment variables for testing
Object.assign(import.meta.env, {
  OPENAI_API_KEY: "test-openai-key",
  OPENROUTER_API_KEY: "test-openrouter-key",
  PUBLIC_SUPABASE_URL: "http://test.supabase.url",
  PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
