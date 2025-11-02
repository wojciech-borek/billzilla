import type { APIRoute } from "astro";
import { deleteExpense } from "@/lib/services/expenseService";
import type { AuthUserWithProfile } from "@/types";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const expenseId = params.id;
    if (!expenseId) {
      return new Response(
        JSON.stringify({
          error: { message: "Expense ID is required" },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get authenticated user
    const user = locals.user as AuthUserWithProfile | undefined;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: { message: "Authentication required" },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = locals.supabase;

    // Delete the expense
    await deleteExpense(supabase, expenseId, user.id);

    return new Response(
      JSON.stringify({
        message: "Expense deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting expense:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return new Response(
          JSON.stringify({
            error: { message: "Wydatek nie został znaleziony" },
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("creator") || error.message.includes("member")) {
        return new Response(
          JSON.stringify({
            error: { message: "Nie masz uprawnień do usunięcia tego wydatku" },
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: { message: "Wystąpił błąd podczas usuwania wydatku" },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
