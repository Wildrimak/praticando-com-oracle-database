/**
 * @description Parses SQL*Plus tabular output into structured data for HTML table rendering.
 * Detects separator lines (---) to identify column boundaries and extract headers/rows.
 * Falls back to plain text for non-tabular output (EXPLAIN PLAN, errors, etc.).
 * @module sql-output-parser
 */

/** Structured table result from SQL*Plus output */
export interface TableResult {
  type: "table";
  headers: string[];
  rows: string[][];
  footer: string;
}

/** Plain text result (EXPLAIN PLAN, errors, messages) */
export interface TextResult {
  type: "text";
  content: string;
}

export type ParsedBlock = TableResult | TextResult;

/**
 * @description Parses full SQL*Plus output into an array of blocks (tables and text).
 * A single output may contain multiple tables interspersed with text.
 * @param {string} output - Raw SQL*Plus output string
 * @returns {ParsedBlock[]} Array of parsed blocks (tables and/or text)
 * @example
 * const blocks = parseSqlOutput("NOME  IDADE\n----- -----\nJoao  25\n\n1 row selected.");
 * // Returns: [{ type: "table", headers: ["NOME", "IDADE"], rows: [["Joao", "25"]], footer: "1 row selected." }]
 */
export function parseSqlOutput(output: string): ParsedBlock[] {
  if (!output || !output.trim()) {
    return [{ type: "text", content: "" }];
  }

  const lines = output.split("\n");
  const blocks: ParsedBlock[] = [];
  let i = 0;
  let textBuffer: string[] = [];

  while (i < lines.length) {
    // Look for separator line pattern (e.g., "---- ------ ----------")
    const sepIndex = findSeparatorLine(lines, i);

    if (sepIndex !== -1 && sepIndex > 0) {
      // Found a table: separator is at sepIndex, header is at sepIndex - 1
      // Flush text buffer (everything before the header line)
      const headerLineIndex = sepIndex - 1;
      // Add lines before header to text buffer
      while (i < headerLineIndex) {
        textBuffer.push(lines[i]);
        i++;
      }

      // Flush accumulated text
      if (textBuffer.length > 0) {
        const text = textBuffer.join("\n").trim();
        if (text) {
          blocks.push({ type: "text", content: text });
        }
        textBuffer = [];
      }

      // Parse the table
      const headerLine = lines[headerLineIndex];
      const separatorLine = lines[sepIndex];
      const columnRanges = getColumnRanges(separatorLine);

      const headers = extractColumns(headerLine, columnRanges);

      // Collect data rows
      const rows: string[][] = [];
      let j = sepIndex + 1;
      while (j < lines.length) {
        const line = lines[j];
        // Empty line or footer signals end of table data
        if (line.trim() === "" || isFooterLine(line)) {
          break;
        }
        rows.push(extractColumns(line, columnRanges));
        j++;
      }

      // Collect footer (e.g., "5 rows selected.")
      let footer = "";
      while (j < lines.length) {
        const line = lines[j];
        if (isFooterLine(line)) {
          footer = line.trim();
          j++;
          break;
        }
        if (line.trim() === "") {
          j++;
          continue;
        }
        break;
      }

      blocks.push({ type: "table", headers, rows, footer });
      i = j;
    } else {
      // No more tables found from current position
      textBuffer.push(lines[i]);
      i++;
    }
  }

  // Flush remaining text
  if (textBuffer.length > 0) {
    const text = textBuffer.join("\n").trim();
    if (text) {
      blocks.push({ type: "text", content: text });
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content: output }];
}

/**
 * @description Finds the next separator line (e.g., "---- ------") starting from a given index.
 * A separator line consists only of dashes and spaces, with at least one group of 2+ dashes.
 * @param {string[]} lines - Array of output lines
 * @param {number} startFrom - Index to start searching from
 * @returns {number} Index of separator line, or -1 if not found
 */
function findSeparatorLine(lines: string[], startFrom: number): number {
  for (let i = startFrom; i < lines.length; i++) {
    if (isSeparatorLine(lines[i]) && i > 0 && !isSeparatorLine(lines[i - 1])) {
      return i;
    }
  }
  return -1;
}

/**
 * @description Checks if a line is a SQL*Plus column separator (dashes and spaces only).
 * Must have at least one group of 2+ consecutive dashes.
 * @param {string} line - A single output line
 * @returns {boolean} True if the line is a separator
 */
function isSeparatorLine(line: string): boolean {
  const trimmed = line.trimEnd();
  if (!trimmed || trimmed.length < 2) return false;
  // Must be only dashes and spaces
  if (!/^[-\s]+$/.test(trimmed)) return false;
  // Must have at least one group of 2+ dashes
  return /--+/.test(trimmed);
}

/**
 * @description Determines column boundaries from a separator line.
 * Each group of consecutive dashes defines a column's [start, end] range.
 * @param {string} separatorLine - The separator line (e.g., "---- ------ ----------")
 * @returns {[number, number][]} Array of [start, end] tuples for each column
 */
function getColumnRanges(separatorLine: string): [number, number][] {
  const ranges: [number, number][] = [];
  let i = 0;

  while (i < separatorLine.length) {
    // Skip spaces
    while (i < separatorLine.length && separatorLine[i] === " ") i++;
    if (i >= separatorLine.length) break;

    // Found start of a dash group
    const start = i;
    while (i < separatorLine.length && separatorLine[i] === "-") i++;
    if (i > start) {
      ranges.push([start, i]);
    }
  }

  return ranges;
}

/**
 * @description Extracts column values from a data line using pre-computed column ranges.
 * @param {string} line - A data line
 * @param {[number, number][]} ranges - Column boundary ranges from the separator
 * @returns {string[]} Trimmed values for each column
 */
function extractColumns(line: string, ranges: [number, number][]): string[] {
  return ranges.map(([start, end]) => {
    // For the last column, take everything to the end of the line
    const isLast = ranges[ranges.length - 1] === ranges.find(r => r[0] === start && r[1] === end);
    const actualEnd = isLast ? Math.max(end, line.length) : end;
    return (line.substring(start, actualEnd) || "").trim();
  });
}

/**
 * @description Checks if a line is a SQL*Plus result footer (e.g., "5 rows selected.").
 * @param {string} line - A single output line
 * @returns {boolean} True if the line matches a footer pattern
 */
function isFooterLine(line: string): boolean {
  const trimmed = line.trim();
  return /^\d+\s+rows?\s+selected\.?$/i.test(trimmed) ||
    /^no\s+rows\s+selected\.?$/i.test(trimmed) ||
    /^Elapsed:/i.test(trimmed);
}

/**
 * @description Checks whether SQL output contains EXPLAIN PLAN or execution plan content.
 * Used to determine whether to use plan-highlighting mode vs table mode.
 * @param {string} output - Raw SQL output
 * @returns {boolean} True if the output looks like an execution plan
 */
export function isExplainPlanOutput(output: string): boolean {
  return /PLAN_TABLE_OUTPUT|Plan hash value|DBMS_XPLAN|TABLE ACCESS|INDEX.*SCAN|NESTED LOOPS|HASH JOIN|MERGE JOIN|SORT ORDER BY/i.test(output);
}
