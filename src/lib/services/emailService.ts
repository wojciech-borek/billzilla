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
  app_url: string;
}

/**
 * Template variables for new user invitations
 */
export interface NewUserInvitationVariables {
  inviter_name: string;
  group_name: string;
  app_url: string;
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
    // Get group information
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("id", groupId)
      .single();

    if (groupError) {
      throw new EmailOperationError("get group info", groupError.message);
    }

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
 * Loads an email template from the filesystem
 *
 * @param templateName - Name of the template file
 * @returns Template content as string
 * @throws {EmailTemplateNotFoundError} If template doesn't exist
 */
async function loadEmailTemplate(templateName: string): Promise<string> {
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
    throw new EmailTemplateNotFoundError(templateName);
  }

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
