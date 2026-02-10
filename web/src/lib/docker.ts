/**
 * @description Server-side module for executing SQL against Oracle via Docker.
 * Runs `docker exec sqlplus` with the user's SQL, applies formatting settings,
 * enforces a 30s timeout and 100KB output limit, and detects Oracle errors.
 * @module docker
 */
import { execFile } from "child_process";

const CONTAINER_NAME = "oracle-tuning-lab";
const DB_USER = "tuning_lab";
const DB_PASS = "tuning123";
const DB_CONN = `${DB_USER}/${DB_PASS}@//localhost:1521/FREEPDB1`;
const TIMEOUT_MS = 30000;
const MAX_OUTPUT_SIZE = 100 * 1024; // 100KB

export interface DockerExecResult {
  output: string;
  success: boolean;
  executionTime: number;
}

/**
 * @description Executes SQL against the Oracle database inside the Docker container.
 * Wraps the SQL with SET LINESIZE/PAGESIZE/TIMING settings and pipes it to sqlplus via stdin.
 * @param {string} sql - The SQL statement(s) to execute
 * @returns {Promise<DockerExecResult>} Result with output text, success flag, and execution time in ms
 */
export async function executeSql(sql: string): Promise<DockerExecResult> {
  const start = Date.now();

  // Wrap SQL with formatting settings
  const wrappedSql = `SET LINESIZE 200
SET PAGESIZE 50000
SET TRIMOUT ON
SET TRIMSPOOL ON
SET FEEDBACK ON
SET TIMING ON
${sql}
EXIT;
`;

  return new Promise((resolve) => {
    const child = execFile(
      "docker",
      ["exec", "-i", CONTAINER_NAME, "sqlplus", "-S", DB_CONN],
      {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_SIZE,
        encoding: "utf-8",
      },
      (error, stdout, stderr) => {
        const executionTime = Date.now() - start;

        if (error) {
          if (error.killed) {
            resolve({
              output: "Query timed out (30s limit exceeded)",
              success: false,
              executionTime,
            });
          } else {
            resolve({
              output: stderr || error.message,
              success: false,
              executionTime,
            });
          }
          return;
        }

        let output = stdout;
        if (output.length > MAX_OUTPUT_SIZE) {
          output =
            output.substring(0, MAX_OUTPUT_SIZE) +
            "\n\n... output truncated (100KB limit) ...";
        }

        // Check for Oracle errors in output
        const hasError = /^(ORA-|SP2-|ERROR)/m.test(output);

        resolve({
          output,
          success: !hasError,
          executionTime,
        });
      }
    );

    // Write SQL to stdin
    if (child.stdin) {
      child.stdin.write(wrappedSql);
      child.stdin.end();
    }
  });
}

/**
 * @description Checks if the Oracle Docker container is running and the database is responding.
 * First verifies the container state via `docker inspect`, then executes `SELECT 1 FROM DUAL`.
 * @returns {Promise<{ containerRunning: boolean, oracleReady: boolean }>}
 */
export async function checkHealth(): Promise<{
  containerRunning: boolean;
  oracleReady: boolean;
}> {
  return new Promise((resolve) => {
    // Check container is running
    execFile(
      "docker",
      ["inspect", "--format", "{{.State.Running}}", CONTAINER_NAME],
      { timeout: 5000 },
      (error, stdout) => {
        if (error || stdout.trim() !== "true") {
          resolve({ containerRunning: false, oracleReady: false });
          return;
        }

        // Check Oracle is responding
        const testSql = "SELECT 1 FROM DUAL;\nEXIT;\n";
        const child = execFile(
          "docker",
          ["exec", "-i", CONTAINER_NAME, "sqlplus", "-S", DB_CONN],
          { timeout: 10000 },
          (error2, stdout2) => {
            if (error2 || !stdout2.includes("1")) {
              resolve({ containerRunning: true, oracleReady: false });
              return;
            }
            resolve({ containerRunning: true, oracleReady: true });
          }
        );

        if (child.stdin) {
          child.stdin.write(testSql);
          child.stdin.end();
        }
      }
    );
  });
}
