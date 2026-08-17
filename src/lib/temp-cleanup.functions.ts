import { createServerFn } from "@tanstack/react-start";

export const tempDeleteTestUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw error;
  const target = data.users.find((u) => u.email === "greta.matas.test@example.com");
  if (!target) return { deleted: false };
  const result = await supabaseAdmin.auth.admin.deleteUser(target.id);
  if (result.error) throw result.error;
  return { deleted: true };
});
