import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@glp1companion.app";

interface PushPayload {
  title: string;
  body: string;
  key: string;
  category: string;
  tag: string;
  data: { deeplink: string; notificationId: string };
  actions?: Array<{ action: string; title: string }>;
}

const NOTIFICATION_PAYLOADS: Record<string, (ctx?: Record<string, string>) => PushPayload> = {
  test: () => ({
    title: "GLP-1 Companion",
    body: "Notifications are working! You'll get reminders right here.",
    key: "test",
    category: "progress",
    tag: "test",
    data: { deeplink: "/settings/notifications", notificationId: crypto.randomUUID() },
  }),
  dose_reminder: (ctx) => ({
    title: "It's your dose day",
    body: "A quick window to take your shot when you're ready — no rush.",
    key: "dose_reminder",
    category: "medication",
    tag: `dose_reminder:${ctx?.userId || ""}`,
    data: { deeplink: "/doses", notificationId: crypto.randomUUID() },
    actions: [
      { action: "log_dose", title: "Log dose" },
      { action: "snooze", title: "Snooze 1h" },
    ],
  }),
  meal_log: (ctx) => ({
    title: `Quick ${ctx?.mealType || "meal"} log?`,
    body: "Takes 20 seconds. Even rough notes help you spot patterns later.",
    key: "meal_log",
    category: "logging",
    tag: `meal_log:${ctx?.userId || ""}`,
    data: { deeplink: `/food?type=${ctx?.mealType || "meal"}`, notificationId: crypto.randomUUID() },
    actions: [
      { action: "log_meal", title: `Log ${ctx?.mealType || "meal"}` },
    ],
  }),
};

async function sendToUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { data: subs } = await supabase
    .from("notification_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return { sent: 0, failed: 0, errors: [] };

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      if (msg.includes("410") || msg.includes("404")) {
        await supabase.from("notification_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  if (sent > 0) {
    await supabase
      .from("notification_settings")
      .update({ last_delivered_at: new Date().toISOString() })
      .eq("user_id", userId);
  }

  return { sent, failed, errors };
}

Deno.serve(async (req: Request) => {
  try {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const type: string = body.type || "test";

    // For user-initiated requests (test), extract user from JWT
    if (type === "test") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing auth" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payloadFn = NOTIFICATION_PAYLOADS[type];
      const payload = payloadFn({ userId: user.id });
      const result = await sendToUser(supabase, user.id, payload);

      return new Response(JSON.stringify({ type, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For cron/service-role triggered sends
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (cronSecret) {
      const providedSecret = new URL(req.url).searchParams.get("secret");
      if (providedSecret !== cronSecret && !authHeader?.includes(serviceRoleKey)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payloadFn = NOTIFICATION_PAYLOADS[type];
    if (!payloadFn) {
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const currentDay = now.getUTCDay();
    const currentHour = now.getUTCHours();

    let eligibleUsers: string[] = [];

    if (type === "dose_reminder") {
      const { data } = await supabase
        .from("notification_settings")
        .select("user_id")
        .eq("dose_reminder_enabled", true)
        .eq("dose_reminder_weekday", currentDay);
      eligibleUsers = (data || []).map((r: { user_id: string }) => r.user_id);
    } else if (type === "meal_log") {
      const { data } = await supabase
        .from("notification_settings")
        .select("user_id")
        .eq("meal_log_enabled", true);
      eligibleUsers = (data || []).map((r: { user_id: string }) => r.user_id);
    }

    let totalSent = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    for (const userId of eligibleUsers) {
      const mealType =
        currentHour < 11 ? "breakfast" : currentHour < 16 ? "lunch" : "dinner";
      const payload = payloadFn({ userId, mealType });
      const result = await sendToUser(supabase, userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
      allErrors.push(...result.errors);
    }

    return new Response(
      JSON.stringify({
        type,
        eligible: eligibleUsers.length,
        sent: totalSent,
        failed: totalFailed,
        errors: allErrors.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
