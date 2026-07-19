// SERVER-SIDE DEVELOPMENT CODE ONLY

import Database from "better-sqlite3";
import { applyLocalPortalMigrations } from "./local-portal.migrations";
import type { LocalPortalConfig, LocalPortalContext } from "./local-portal.types";

export function createLocalPortalContext(config: LocalPortalConfig): LocalPortalContext {
  if (config.state !== "configured") {
    return {
      config,
      db: null
    };
  }

  const db = new Database(config.databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  applyLocalPortalMigrations(db);

  return {
    config,
    db
  };
}

