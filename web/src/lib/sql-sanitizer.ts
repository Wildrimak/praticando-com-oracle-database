/**
 * @description SQL sanitizer that validates user-submitted SQL against a blocklist/allowlist.
 * Blocks DDL, DML writes, OS commands, dangerous PL/SQL, and system modifications.
 * Allows SELECT, EXPLAIN PLAN, DBMS_XPLAN, SET AUTOTRACE, and safe ALTER SESSION commands.
 * @module sql-sanitizer
 */

const BLOCKED_PATTERNS = [
  // DDL
  /\b(DROP|TRUNCATE|ALTER\s+SYSTEM|ALTER\s+TABLE|CREATE\s+TABLE|CREATE\s+USER|GRANT|REVOKE)\b/i,
  // DML writes
  /\b(INSERT|UPDATE|DELETE|MERGE)\b/i,
  // OS commands
  /\b(HOST|!\s*\w)/i,
  // PL/SQL dangerous
  /\b(EXECUTE\s+IMMEDIATE|DBMS_SCHEDULER|UTL_FILE|UTL_HTTP|UTL_TCP|DBMS_PIPE)\b/i,
  // System modifications
  /\b(SHUTDOWN|STARTUP|ALTER\s+DATABASE|ALTER\s+SESSION\s+SET\s+(?!NLS_|STATISTICS_LEVEL|OPTIMIZER_USE_INVISIBLE_INDEXES))\b/i,
];

const ALLOWED_PATTERNS = [
  /^\s*SELECT\b/i,
  /^\s*EXPLAIN\s+PLAN\b/i,
  /^\s*SET\s+(AUTOTRACE|TIMING|LINESIZE|PAGESIZE|SERVEROUTPUT)\b/i,
  /^\s*SELECT\s+\*\s+FROM\s+(TABLE\s*\()?DBMS_XPLAN/i,
  /^\s*WITH\b/i,
  /^\s*--/,
  /^\s*$/,
  /^\s*@/,
  /^\s*ALTER\s+SESSION\s+SET\s+(STATISTICS_LEVEL|NLS_|OPTIMIZER_USE_INVISIBLE_INDEXES)/i,
];

export interface SanitizeResult {
  safe: boolean;
  reason?: string;
}

/**
 * @description Validates a SQL string against blocked/allowed patterns.
 * Splits into individual statements and checks each one.
 * @param {string} sql - The SQL string to validate
 * @returns {SanitizeResult} Object with `safe` boolean and optional `reason` string
 * @example
 * sanitizeSql("SELECT * FROM clientes") // { safe: true }
 * sanitizeSql("DROP TABLE clientes")    // { safe: false, reason: "Blocked command detected: ..." }
 */
export function sanitizeSql(sql: string): SanitizeResult {
  if (!sql || sql.trim().length === 0) {
    return { safe: false, reason: "Empty SQL" };
  }

  if (sql.length > 10000) {
    return { safe: false, reason: "SQL too long (max 10000 chars)" };
  }

  // Check each statement (split by semicolons, ignoring those inside strings)
  const statements = splitStatements(sql);

  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (!trimmed || trimmed.startsWith("--")) continue;

    // Check blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          reason: `Blocked command detected: ${pattern.source}`,
        };
      }
    }

    // Check if it matches at least one allowed pattern
    const isAllowed = ALLOWED_PATTERNS.some((p) => p.test(trimmed));
    if (!isAllowed) {
      return {
        safe: false,
        reason: `Command not in allowlist`,
      };
    }
  }

  return { safe: true };
}

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (char === "'" && !inSingleQuote) {
      inSingleQuote = true;
      current += char;
    } else if (char === "'" && inSingleQuote) {
      // Check for escaped quote ''
      if (i + 1 < sql.length && sql[i + 1] === "'") {
        current += "''";
        i++;
      } else {
        inSingleQuote = false;
        current += char;
      }
    } else if (char === ";" && !inSingleQuote) {
      statements.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    statements.push(current);
  }

  return statements;
}
