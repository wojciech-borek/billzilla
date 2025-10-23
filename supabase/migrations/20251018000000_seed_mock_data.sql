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
