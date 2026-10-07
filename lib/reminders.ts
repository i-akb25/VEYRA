import type { ApplicationRecord } from "./types";

export function dueReminders(records: ApplicationRecord[], now = new Date()) {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return records.filter((record) => record.status !== "rejected" && record.status !== "offer").flatMap((record) =>
    (["deadline", "followUp"] as const).filter((kind) => /^\d{4}-\d{2}-\d{2}$/.test(record[kind]) && record[kind] <= day).map((kind) => ({ key: `${record.id}:${kind}:${record[kind]}:${day}`, record, kind, overdue: record[kind] < day }))
  );
}

export async function showLocalNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  try {
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (registration) await registration.showNotification(title, { body, icon: "/icons/icon-192.png" });
    else new Notification(title, { body });
    return true;
  } catch { return false; }
}
