// src/lib/utils/env.ts

/**
 * Safely resolve API key from multiple sources
 * Priority: config > env (explicit) > import.meta.env (Astro) > process.env (Node/local) > undefined
 */
export function resolveApiKey(configApiKey?: string, env?: Record<string, string | undefined>): string | undefined {
  // 1) explicit config
  if (configApiKey) return configApiKey;

  // 2) env passed explicitly (context.env in Pages Functions)
  if (env) {
    if (env.OPENAI_API_KEY) return env.OPENAI_API_KEY;
    if (env.OPENROUTER_API_KEY) return env.OPENROUTER_API_KEY;
  }

  // 3) import.meta.env (Astro dev environment)
  try {
    const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
    if (metaEnv) {
      if (metaEnv.OPENAI_API_KEY) return metaEnv.OPENAI_API_KEY;
      if (metaEnv.OPENROUTER_API_KEY) return metaEnv.OPENROUTER_API_KEY;
    }
  } catch {
    // import.meta.env not available
  }

  // 4) process.env (Node / local)
  if (typeof process !== "undefined" && process.env) {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
    if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  }

  // 5) not found
  return undefined;
}

/**
 * Resolve OpenAI API key specifically
 */
export function resolveOpenAIApiKey(
  configApiKey?: string,
  env?: Record<string, string | undefined>
): string | undefined {
  // 1) explicit config
  if (configApiKey) return configApiKey;

  // 2) env passed explicitly (context.env in Pages Functions)
  if (env?.OPENAI_API_KEY) return env.OPENAI_API_KEY;

  // 3) process.env (Node / Cloudflare Pages Functions)
  if (typeof process !== "undefined" && process.env?.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // 4) import.meta.env (Astro dev environment)
  try {
    const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
    if (metaEnv?.OPENAI_API_KEY) return metaEnv.OPENAI_API_KEY;
  } catch {
    // import.meta.env not available
  }

  // 5) globalThis (Cloudflare Workers/Pages runtime)
  if (typeof globalThis !== "undefined" && (globalThis as any).OPENAI_API_KEY) {
    return (globalThis as any).OPENAI_API_KEY;
  }

  // 6) not found
  return undefined;
}

/**
 * Resolve OpenRouter API key specifically
 */
export function resolveOpenRouterApiKey(
  configApiKey?: string,
  env?: Record<string, string | undefined>
): string | undefined {
  // 1) explicit config
  if (configApiKey) return configApiKey;

  // 2) env passed explicitly (context.env in Pages Functions)
  if (env?.OPENROUTER_API_KEY) return env.OPENROUTER_API_KEY;

  // 3) process.env (Node / Cloudflare Pages Functions)
  if (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }

  // 4) import.meta.env (Astro dev environment)
  try {
    const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
    if (metaEnv?.OPENROUTER_API_KEY) return metaEnv.OPENROUTER_API_KEY;
  } catch {
    // import.meta.env not available
  }

  // 5) globalThis (Cloudflare Workers/Pages runtime)
  if (typeof globalThis !== "undefined" && (globalThis as any).OPENROUTER_API_KEY) {
    return (globalThis as any).OPENROUTER_API_KEY;
  }

  // 6) not found
  return undefined;
}
