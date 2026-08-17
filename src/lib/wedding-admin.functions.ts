import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * The first signed-in account becomes the wedding organiser (admin).
 * Afterwards this is a no-op, so nobody else can grant themselves access.
 */
export const claimAdminIfFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) throw countError;

    if ((count ?? 0) === 0) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "admin" });
      if (error && error.code !== "23505") throw error;
      return { isAdmin: true };
    }

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw error;
    return { isAdmin: Boolean(data) };
  });
