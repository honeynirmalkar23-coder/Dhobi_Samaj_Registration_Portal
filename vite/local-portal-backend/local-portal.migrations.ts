// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";

type Migration = {
  version: number;
  sql: string;
};

const migrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS registration_counters (
        registration_year INTEGER PRIMARY KEY,
        last_value INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        registration_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        education_level TEXT NOT NULL,
        education_details TEXT NULL,
        permanent_address TEXT NOT NULL,
        boys_count INTEGER NOT NULL DEFAULT 0,
        girls_count INTEGER NOT NULL DEFAULT 0,
        elders_count INTEGER NOT NULL DEFAULT 0,
        total_family_members INTEGER NOT NULL,
        applicant_photo_path TEXT NOT NULL,
        applicant_photo_mime_type TEXT NOT NULL,
        applicant_photo_size_bytes INTEGER NOT NULL,
        registration_status TEXT NOT NULL DEFAULT 'awaiting_payment',
        payment_status TEXT NOT NULL DEFAULT 'not_submitted',
        payment_access_token_hash TEXT NOT NULL,
        payment_access_token_expires_at TEXT NOT NULL,
        payment_resubmission_allowed INTEGER NOT NULL DEFAULT 0,
        public_rejection_message TEXT NULL,
        admin_notes TEXT NULL,
        payment_submitted_at TEXT NULL,
        payment_verified_at TEXT NULL,
        reviewed_at TEXT NULL,
        approved_at TEXT NULL,
        rejected_at TEXT NULL,
        archived_at TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        CHECK (age BETWEEN 1 AND 120),
        CHECK (boys_count BETWEEN 0 AND 99),
        CHECK (girls_count BETWEEN 0 AND 99),
        CHECK (elders_count BETWEEN 0 AND 99),
        CHECK (total_family_members = boys_count + girls_count + elders_count),
        CHECK (registration_status IN ('awaiting_payment','submitted','under_review','approved','rejected','archived')),
        CHECK (payment_status IN ('not_submitted','pending_verification','verified','rejected'))
      );

      CREATE TABLE IF NOT EXISTS payment_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payment_enabled INTEGER NOT NULL DEFAULT 0,
        qr_code_path TEXT NULL,
        qr_code_mime_type TEXT NULL,
        qr_code_size_bytes INTEGER NULL,
        upi_id TEXT NULL,
        payee_name TEXT NULL,
        amount REAL NULL,
        payment_title TEXT NULL,
        instructions TEXT NULL,
        public_contact TEXT NULL,
        payment_deadline TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment_proofs (
        id TEXT PRIMARY KEY,
        registration_record_id TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        original_filename TEXT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        proof_status TEXT NOT NULL DEFAULT 'pending_verification',
        acknowledgement_number TEXT UNIQUE NOT NULL,
        public_rejection_message TEXT NULL,
        submitted_at TEXT NOT NULL,
        reviewed_at TEXT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (registration_record_id) REFERENCES registrations(id)
      );

      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        registration_record_id TEXT NULL,
        registration_id TEXT NULL,
        administrator_email TEXT NOT NULL,
        previous_value TEXT NULL,
        new_value TEXT NULL,
        metadata TEXT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS registrations_status_idx
        ON registrations(registration_status, payment_status, created_at);
      CREATE INDEX IF NOT EXISTS payment_proofs_registration_idx
        ON payment_proofs(registration_record_id, submitted_at DESC);
      CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx
        ON admin_audit_logs(created_at DESC);
    `
  }
];

export function applyLocalPortalMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_schema_versions (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const hasVersion = db.prepare("SELECT 1 FROM local_schema_versions WHERE version = ? LIMIT 1");
  const insertVersion = db.prepare("INSERT INTO local_schema_versions (version, applied_at) VALUES (?, ?)");

  for (const migration of migrations) {
    if (hasVersion.get(migration.version)) {
      continue;
    }

    const apply = db.transaction(() => {
      db.exec(migration.sql);
      insertVersion.run(migration.version, new Date().toISOString());
    });

    apply();
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO payment_settings (id, payment_enabled, created_at, updated_at)
    VALUES (1, 0, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(now, now);
}

