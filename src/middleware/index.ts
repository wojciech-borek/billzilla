import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

// TODO: Remove this mock user once authentication is implemented
const MOCK_USER_ENABLED = true;
const MOCK_USER = {
  id: '232d7f93-8f3b-419d-b69d-00eff6a548da',
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
