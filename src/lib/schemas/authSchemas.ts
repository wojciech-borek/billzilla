import { z } from "zod";

/**
 * Schema dla logowania
 * Używany w LoginForm component
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format adresu e-mail")
    .toLowerCase()
    .trim(),

  password: z.string().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć minimum 8 znaków"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema dla rejestracji
 * Używany w SignupForm component
 * Uwaga: full_name to elastyczne pole - może być login, pseudonim, ksywka, itp.
 */
export const signupSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "To pole jest wymagane")
      .min(2, "Nazwa musi mieć minimum 2 znaki")
      .max(50, "Nazwa może mieć maksymalnie 50 znaków")
      .trim(),

    email: z
      .string()
      .min(1, "Adres e-mail jest wymagany")
      .email("Nieprawidłowy format adresu e-mail")
      .toLowerCase()
      .trim(),

    password: z
      .string()
      .min(1, "Hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać przynajmniej jedną literę"),

    confirm_password: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Hasła muszą być identyczne",
    path: ["confirm_password"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Schema dla żądania resetu hasła
 * Używany w ResetPasswordForm component (tryb 'request')
 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format adresu e-mail")
    .toLowerCase()
    .trim(),
});

export type RequestPasswordResetData = z.infer<typeof requestPasswordResetSchema>;

/**
 * Schema dla ustawiania nowego hasła
 * Używany w ResetPasswordForm component (tryb 'reset')
 */
export const setNewPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "Nowe hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać przynajmniej jedną literę"),

    confirm_password: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Hasła muszą być identyczne",
    path: ["confirm_password"],
  });

export type SetNewPasswordData = z.infer<typeof setNewPasswordSchema>;
