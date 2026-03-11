import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("PROJECT_URL")!,
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.auth.admin.listUsers();

  return new Response(
    JSON.stringify(error ? { error } : data.users),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // allow frontend
      },
    }
  );
});
