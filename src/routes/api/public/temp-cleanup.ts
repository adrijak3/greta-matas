import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/temp-cleanup")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) return new Response(error.message, { status: 500 });
        const target = data.users.find((u) => u.email === "greta.matas.test@example.com");
        if (!target) return new Response("none");
        const result = await supabaseAdmin.auth.admin.deleteUser(target.id);
        return new Response(result.error ? result.error.message : "deleted");
      },
    },
  },
});
