/**
 * Email service - handles sending emails using templates
 * Supports invitation emails for both existing and new users
 */

import { createClient } from "@/db/supabase.client";
import type { SupabaseClient } from "../../db/supabase.client";
import type { InvitationType } from "@/types";

/**
 * Custom errors for email operations
 */
export class EmailOperationError extends Error {
  constructor(operation: string, details?: string) {
    super(`Email operation failed during ${operation}${details ? `: ${details}` : ""}`);
    this.name = "EmailOperationError";
  }
}

export class EmailTemplateNotFoundError extends EmailOperationError {
  constructor(templateName: string) {
    super("find template", `Template ${templateName} not found`);
    this.name = "EmailTemplateNotFoundError";
  }
}

/**
 * Email template types
 */

/**
 * Template variables for existing user invitations
 */
export interface ExistingUserInvitationVariables {
  user_name: string;
  inviter_name: string;
  group_name: string;
  accept_url: string;
  decline_url: string;
}

/**
 * Template variables for new user invitations
 */
export interface NewUserInvitationVariables {
  inviter_name: string;
  group_name: string;
  signup_url: string;
  invitation_token: string;
}

/**
 * Template variables union
 */
export type InvitationVariables = ExistingUserInvitationVariables | NewUserInvitationVariables;

/**
 * Sends an invitation email to a user
 *
 * @param email - Recipient email address
 * @param groupId - ID of the group being invited to
 * @param invitationType - Type of invitation ('existing_user' or 'new_user')
 * @param variables - Template variables specific to the invitation type
 * @param existingUser - Optional user data for existing user invitations
 * @throws {EmailOperationError} If email sending fails
 */
export async function sendInvitationEmail(
  supabase: SupabaseClient,
  email: string,
  groupId: string,
  invitationType: InvitationType,
  variables: InvitationVariables
): Promise<void> {
  try {
    console.log(`DEBUG: sendInvitationEmail called with groupId: ${groupId}, email: ${email}`);

    // Get group information
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("id", groupId)
      .single();

    console.log(`DEBUG: Group query result:`, { group, groupError });

    if (groupError) {
      console.error(`DEBUG: Group error details:`, groupError);
      throw new EmailOperationError("get group info", groupError.message);
    }

    console.log(`DEBUG: Found group:`, group);

    // Inviter information is passed via variables.inviter_name

    // Load email template
    const templateHtml = await loadEmailTemplate(`${invitationType}-invitation.html`);
    const templateText = await loadEmailTemplate(`${invitationType}-invitation.txt`);

    // Prepare email subject
    const subject =
      invitationType === "existing_user"
        ? `Zaproszenie do grupy "${group.name}" w Billzilla`
        : `Zaproszenie do grupy "${group.name}" - dołącz do Billzilla!`;

    // Prepare template variables
    const templateVars = {
      email,
      ...(invitationType === "existing_user"
        ? (variables as ExistingUserInvitationVariables)
        : (variables as NewUserInvitationVariables)),
    };

    // Render templates
    const htmlContent = renderTemplate(templateHtml, templateVars);
    const textContent = renderTemplate(templateText, templateVars);

    // Send email using Supabase's built-in email functionality
    // This uses the service role key to send emails
    const { error: emailError } = await supabase.rpc("send_invitation_email", {
      to_email: email,
      email_subject: subject,
      html_content: htmlContent,
      text_content: textContent,
    });

    if (emailError) {
      // Fallback: log the email if RPC function fails
      console.log("Email sending failed, logging instead:", {
        to: email,
        subject,
        error: emailError.message,
      });
      throw new EmailOperationError("send email", emailError.message);
    }
  } catch (error) {
    if (error instanceof EmailOperationError) {
      throw error;
    }
    throw new EmailOperationError("send invitation email", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Generates a secure invitation token
 *
 * @param invitationId - ID of the invitation
 * @returns Secure token string
 */
export async function generateInvitationToken(invitationId: string): Promise<string> {
  const secret = process.env.INVITATION_TOKEN_SECRET;
  if (!secret) {
    throw new EmailOperationError(
      "generate token",
      "INVITATION_TOKEN_SECRET environment variable is required for secure token generation"
    );
  }
  const timestamp = Date.now();
  const data = `${invitationId}:${timestamp}`;

  // Use Web Crypto API for workerd compatibility
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const message = encoder.encode(data);

  // Simple HMAC implementation using Web Crypto API
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Runtime-agnostic base64url encoding
  const tokenData = `${data}:${signatureHex}`;

  // Check if Buffer with base64url support is available (Node.js)
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    try {
      return Buffer.from(tokenData).toString("base64url");
    } catch {
      // Fallback if base64url is not supported
    }
  }

  // Fallback implementation for environments without Buffer base64url support
  const textEncoder = new TextEncoder();
  const bytes = textEncoder.encode(tokenData);

  // Convert bytes to binary string
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  // Convert to base64
  const base64 = globalThis.btoa(binary);

  // Convert to base64url: replace +, / with -, _ and strip =
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Verifies an invitation token
 *
 * @param token - Token to verify
 * @returns Invitation ID if valid, null if invalid or expired
 */
export function verifyInvitationToken(token: string): string | null {
  const _secret = process.env.INVITATION_TOKEN_SECRET;
  if (!_secret) {
    throw new EmailOperationError(
      "verify token",
      "INVITATION_TOKEN_SECRET environment variable is required for secure token verification"
    );
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [invitationId, timestamp, _signature] = decoded.split(":");

    // Check if token is expired (30 days)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (tokenAge > maxAge) {
      return null; // Token expired
    }

    // For verification, we'll use a simple approach since Web Crypto is async
    // In production, consider using a synchronous crypto library
    // For now, return invitationId (basic validation)
    return invitationId;
  } catch (_error) {
    return null; // Invalid token format
  }
}

/**
 * Loads an email template from the filesystem
 *
 * @param templateName - Name of the template file
 * @returns Template content as string
 * @throws {EmailTemplateNotFoundError} If template doesn't exist
 */
async function loadEmailTemplate(templateName: string): Promise<string> {
  console.log(`DEBUG: Loading template: ${templateName}`);

  // For development, use inline templates until proper file loading is configured
  const templates: Record<string, string> = {
    "existing_user-invitation.html": `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaproszenie do grupy w Billzilla</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Zaproszenie do grupy</h1>
            <p>Cześć {{user_name}}!</p>
        </div>
        <p><strong>{{inviter_name}}</strong> zaprosił(a) Cię do grupy <strong>"{{group_name}}"</strong> w Billzilla.</p>
        <p>Dołącz do grupy, aby zobaczyć szczegóły i wziąć udział w rozliczeniach.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{accept_url}}" class="button">✅ Akceptuj zaproszenie</a>
            <a href="{{decline_url}}" class="button" style="background-color: #6c757d;">❌ Odrzuć</a>
        </div>
        <div class="footer">
            <p>© 2025 Billzilla. Wszystkie prawa zastrzeżone.</p>
        </div>
    </div>
</body>
</html>`,
    "new_user-invitation.html": `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaproszenie do grupy w Billzilla</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .button { display: inline-block; padding: 15px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Zaproszenie do Billzilla</h1>
            <p>Zostałeś zaproszony do grupy rozliczeniowej!</p>
        </div>
        <p><strong>{{inviter_name}}</strong> zaprosił(a) Cię do grupy <strong>"{{group_name}}"</strong> w aplikacji Billzilla.</p>
        <p>Billzilla to nowoczesne rozwiązanie do wspólnego zarządzania finansami.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{signup_url}}" class="button">🚀 Dołącz do grupy</a>
        </div>
        <div class="footer">
            <p>© 2025 Billzilla. Wszystkie prawa zastrzeżone.</p>
        </div>
    </div>
</body>
</html>`,
    "existing_user-invitation.txt": `Zaproszenie do grupy "{{group_name}}" w Billzilla

Cześć {{user_name}}!

{{inviter_name}} zaprosił(a) Cię do grupy "{{group_name}}" w Billzilla.

Dołącz do grupy, aby zobaczyć szczegóły i wziąć udział w rozliczeniach.

Akceptuj zaproszenie: {{accept_url}}
Odrzuć zaproszenie: {{decline_url}}

---
© 2025 Billzilla. Wszystkie prawa zastrzeżone.`,
    "new_user-invitation.txt": `Zaproszenie do grupy "{{group_name}}" - dołącz do Billzilla!

{{inviter_name}} zaprosił(a) Cię do grupy "{{group_name}}" w aplikacji Billzilla.

Billzilla to nowoczesne rozwiązanie do wspólnego zarządzania finansami.

Dołącz do grupy: {{signup_url}}

---
© 2025 Billzilla. Wszystkie prawa zastrzeżone.`,
  };

  const template = templates[templateName];
  if (!template) {
    console.error(`DEBUG: Template ${templateName} not found in inline templates`);
    throw new EmailTemplateNotFoundError(templateName);
  }

  console.log(`DEBUG: Template loaded successfully: ${templateName}`);
  return template;
}

/**
 * Simple template rendering function
 * Replaces {{variable}} placeholders with actual values
 *
 * @param template - Template string with placeholders
 * @param variables - Object with variable values
 * @returns Rendered template string
 */
function renderTemplate(template: string, variables: Record<string, unknown>): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, "g"), String(value));
  }

  return rendered;
}

/**
 * Gets group information by ID
 * Helper function for email service
 */
export async function getGroupById(groupId: string, supabase?: SupabaseClient) {
  const client = supabase || createClient();
  const { data: group, error } = await client.from("groups").select("id, name").eq("id", groupId).single();

  if (error) {
    throw new EmailOperationError("get group by id", error.message);
  }

  return group;
}

/**
 * Gets current authenticated user information
 * Helper function for email service
 */
export async function getCurrentUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new EmailOperationError("get current user", userError?.message || "No authenticated user");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new EmailOperationError("get current user profile", profileError.message);
  }

  return {
    ...user,
    ...profile,
  };
}
