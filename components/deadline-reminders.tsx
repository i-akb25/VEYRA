"use client";

import { useEffect, useState } from "react";
import { dueReminders, showLocalNotification } from "@/lib/reminders";
import type { ApplicationRecord } from "@/lib/types";

export function DeadlineReminders({ records }: { records: ApplicationRecord[] }) {
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState("");
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const time = new Date(); setNow(time);
      try {
        if (localStorage.getItem("veyra.reminders.enabled.v1") !== "true") return;
        const stored = JSON.parse(localStorage.getItem("veyra.reminders.sent.v1") ?? "[]");
        const sent: string[] = Array.isArray(stored) ? stored : [];
        const pending = dueReminders(records, time).filter((item) => !sent.includes(item.key));
        if (pending.length && await showLocalNotification(`VEYRA: ${pending.length} deadline / follow-up reminder(s)`, "Open your local application workspace to review due dates.")) localStorage.setItem("veyra.reminders.sent.v1", JSON.stringify([...sent, ...pending.map((item) => item.key)].slice(-500)));
      } catch { /* The visible reminder list remains available without storage. */ }
    };
    void tick(); const timer = setInterval(() => { void tick(); }, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [records]);
  async function enable() {
    if (!("Notification" in window)) { setStatus("Browser alerts are unavailable. Due dates are still shown here."); return; }
    try { const permission = await Notification.requestPermission(); if (permission === "granted") { localStorage.setItem("veyra.reminders.enabled.v1", "true"); setStatus("Local reminders enabled while VEYRA is open."); } else setStatus("Permission not granted. Due dates remain visible."); } catch { setStatus("Could not enable browser reminders."); }
  }
  const due = dueReminders(records, now);
  return <aside className="deadline-reminders"><h3>Local deadline reminders</h3><p>Checked when you open VEYRA and every minute while this tab is visible. Alerts cannot reliably run when the site is closed. No dates or notes are uploaded.</p><button onClick={enable}>Enable deadline alerts</button><button onClick={() => { try { localStorage.removeItem("veyra.reminders.enabled.v1"); setStatus("Deadline alerts disabled."); } catch { setStatus("Browser storage is unavailable."); } }}>Disable deadline alerts</button>{status && <p role="status">{status}</p>}{due.length ? <ul>{due.slice(0, 20).map((item) => <li key={item.key}>{item.record.job.title} · {item.kind === "deadline" ? "Deadline" : "Follow-up"}: {item.record[item.kind]} {item.overdue ? "(overdue)" : "(today)"}</li>)}</ul> : <p>No deadlines or follow-ups due today.</p>}</aside>;
}
