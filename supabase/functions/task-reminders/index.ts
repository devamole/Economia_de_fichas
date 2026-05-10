import { createClient } from "jsr:@supabase/supabase-js@2";
import esMessages from "./messages/es.json" with { type: "json" };
import enMessages from "./messages/en.json" with { type: "json" };

type Messages = typeof esMessages;
const messages: Record<string, Messages> = { es: esMessages, en: enMessages };

function getMessages(locale: string): Messages {
  return messages[locale] ?? messages["es"];
}

function formatMessage(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

interface TaskRow {
  task_id: string;
  profile_id: string;
  title: string;
  emoji: string | null;
  points: number;
  locale: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Query tasks due in the current 5-minute window for each family timezone.
  // PostgreSQL handles all timezone math; we only trigger the query.
  const { data: tasks, error } = await supabase.rpc("get_tasks_due_for_reminder");

  if (error) {
    console.error("get_tasks_due_for_reminder error:", error.message);
    return new Response(error.message, { status: 500 });
  }

  if (!tasks || tasks.length === 0) {
    return new Response(JSON.stringify({ reminded: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const sendPushUrl =
    Deno.env.get("SUPABASE_URL")! + "/functions/v1/send-push";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let reminded = 0;

  for (const task of tasks as TaskRow[]) {
    // Upsert reminder_log with ignoreDuplicates — if the unique constraint
    // (task_id, profile_id, sent_for_date) fires, count is 0 and we skip.
    const { count, error: logError } = await supabase
      .from("reminder_log")
      .upsert(
        {
          task_id: task.task_id,
          profile_id: task.profile_id,
          sent_for_date: new Date().toISOString().slice(0, 10),
        },
        { onConflict: "task_id,profile_id,sent_for_date", ignoreDuplicates: true, count: "exact" },
      );

    if (logError) {
      console.error("reminder_log upsert error:", logError.message);
      continue;
    }
    if (!count || count === 0) continue;

    const msg = getMessages(task.locale);
    const title = formatMessage(msg.reminder_title, { taskTitle: task.title });
    const body = formatMessage(msg.reminder_body, { points: task.points });
    const emoji = task.emoji ?? "";
    const fullTitle = emoji ? `${emoji} ${title}` : title;

    try {
      await fetch(sendPushUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          profile_ids: [task.profile_id],
          title: fullTitle,
          body,
          url: "/child/today",
        }),
      });
      reminded++;
    } catch (err) {
      console.error("send-push error for task", task.task_id, err);
    }
  }

  return new Response(JSON.stringify({ reminded }), {
    headers: { "Content-Type": "application/json" },
  });
});
