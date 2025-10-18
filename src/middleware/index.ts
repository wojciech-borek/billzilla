import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

// TODO: Remove this mock user once authentication is implemented
const MOCK_USER_ENABLED = true;
const MOCK_USER = {
  id: 'a03a4995-0dec-4213-8a61-2f1c81b3133f',
  email: 'wojbor90@gmail.com'
};

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;
  
  // Mock user for development (remove when auth is ready)
  if (MOCK_USER_ENABLED) {
    context.locals.user = MOCK_USER;
  } else {
    // TODO: Implement real authentication
    // Example:
    // const { data: { session } } = await supabaseClient.auth.getSession();
    // context.locals.user = session?.user ? { id: session.user.id, email: session.user.email } : null;
    context.locals.user = null;
  }
  
  return next();
});
