// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";

function getKolkataYear(now = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric"
  });

  return Number(formatter.format(now));
}

export function generateRegistrationId(db: Database, now = new Date()): string {
  const year = getKolkataYear(now);
  const timestamp = now.toISOString();
  const current = db
    .prepare("SELECT last_value FROM registration_counters WHERE registration_year = ?")
    .get(year) as { last_value: number } | undefined;
  const nextValue = (current?.last_value ?? 0) + 1;

  db.prepare(`
    INSERT INTO registration_counters (registration_year, last_value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(registration_year)
    DO UPDATE SET last_value = excluded.last_value, updated_at = excluded.updated_at
  `).run(year, nextValue, timestamp);

  return `DS-${year}-${String(nextValue).padStart(6, "0")}`;
}

