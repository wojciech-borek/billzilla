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
    const templateHtml = await loadEmailTemplate(`${invitationType.replace("_", "-")}-invitation.html`);
    const templateText = await loadEmailTemplate(`${invitationType.replace("_", "-")}-invitation.txt`);

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

    // Send email using nodemailer with Gmail SMTP
    // Uses SMTP credentials from environment variables
    // Local: .env file, Production: Cloudflare Runtime Environment Variables
    const nodemailer = await import("nodemailer");
    const path = await import("path");

    const transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // use STARTTLS
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Billzilla" <noreply@billzilla.app>',
      to: email,
      subject: subject,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: "billzilla-logo.png",
          path: path.join(process.cwd(), "public", "billzilla-logo.png"),
          cid: "logo", // Content-ID for inline reference
        },
      ],
    });
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
  try {
    // Load template from file system
    const fs = await import("fs/promises");
    const path = await import("path");

    // Construct path to template file
    const templatePath = path.join(process.cwd(), "src", "templates", "emails", templateName);

    // Read file content
    const content = await fs.readFile(templatePath, "utf-8");
    return content;
  } catch (_error) {
    throw new EmailTemplateNotFoundError(templateName);
  }
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
