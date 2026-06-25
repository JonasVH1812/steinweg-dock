// Audit logging for all data changes - anti-fraud trail
import { query, generateId } from './pg-db';

export interface AuditEntry {
  action: string;
  tableName: string;
  recordId: string;
  performedBy: string;
  oldValue?: string;
  newValue?: string;
  ip?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO "AuditLog" ("id", "action", "tableName", "recordId", "performedBy", "oldValue", "newValue", "ip", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [generateId(), entry.action, entry.tableName, entry.recordId, entry.performedBy,
       entry.oldValue ? JSON.stringify(entry.oldValue) : null,
       entry.newValue ? JSON.stringify(entry.newValue) : null,
       entry.ip || null]
    );
  } catch (err) {
    // Don't fail the main operation if audit logging fails
    console.error('Audit log error:', err);
  }
}

// Create the AuditLog table if it doesn't exist (called from setup)
export const auditTableSQL = `
  CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
  );
  CREATE INDEX IF NOT EXISTS "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");
  CREATE INDEX IF NOT EXISTS "AuditLog_tableName_idx" ON "AuditLog"("tableName");
  CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
`;
