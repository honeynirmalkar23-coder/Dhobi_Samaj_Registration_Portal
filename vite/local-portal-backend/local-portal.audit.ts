// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";

export function insertAuditLog(params: {
  db: Database;
  action: string;
  administratorEmail: string;
  registrationRecordId?: string | null;
  registrationId?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
}): void {
  params.db.prepare(`
    INSERT INTO admin_audit_logs (
      id,
      action,
      registration_record_id,
      registration_id,
      administrator_email,
      previous_value,
      new_value,
      metadata,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    params.action,
    params.registrationRecordId ?? null,
    params.registrationId ?? null,
    params.administratorEmail,
    params.previousValue === undefined ? null : JSON.stringify(params.previousValue),
    params.newValue === undefined ? null : JSON.stringify(params.newValue),
    params.metadata === undefined ? null : JSON.stringify(params.metadata),
    new Date().toISOString()
  );
}

