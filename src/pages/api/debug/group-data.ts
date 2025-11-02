/**
 * Debug endpoint to inspect group data
 * GET /api/debug/group-data?groupId=<groupId>
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const groupId = url.searchParams.get("groupId");
    if (!groupId) {
      return new Response(JSON.stringify({ error: "groupId parameter required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is member of the group
    const { data: membership } = await locals.supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", locals.user.id)
      .eq("status", "active")
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member of this group" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all relevant data
    const [expenses, expenseSplits, settlements, groupCurrencies, members] = await Promise.all([
      locals.supabase
        .from("expenses")
        .select(
          `
          id,
          description,
          amount,
          currency_code,
          payer_id,
          created_at,
          profiles!expenses_payer_id_fkey (
            full_name
          )
        `
        )
        .eq("group_id", groupId),

      locals.supabase
        .from("expense_splits")
        .select(
          `
          amount,
          profile_id,
          expenses!inner (
            id,
            description,
            currency_code,
            group_id
          ),
          profiles (
            full_name
          )
        `
        )
        .eq("expenses.group_id", groupId),

      locals.supabase
        .from("settlements")
        .select(
          `
          amount,
          payer_id,
          payee_id,
          created_at,
          profiles!settlements_payer_id_fkey (
            full_name
          ),
          payee:profiles!settlements_payee_id_fkey (
            full_name
          )
        `
        )
        .eq("group_id", groupId),

      locals.supabase.from("group_currencies").select("currency_code, exchange_rate").eq("group_id", groupId),

      locals.supabase
        .from("group_members")
        .select(
          `
          profile_id,
          status,
          profiles (
            full_name
          )
        `
        )
        .eq("group_id", groupId)
        .eq("status", "active"),
    ]);

    return new Response(
      JSON.stringify(
        {
          groupId,
          expenses: expenses.data,
          expenseSplits: expenseSplits.data,
          settlements: settlements.data,
          groupCurrencies: groupCurrencies.data,
          members: members.data,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
