import { normalize, normalizedChar } from './utils.js';
import { Replacement } from './replacement.js';

/**
 * Zero-dependency CSV parser that handles quoted fields and embedded commas/newlines.
 * Returns an array of objects keyed by the header row.
 */
export function parseCSV(csvString) {
  const rows = [];
  const lines = csvString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  let pos = 0;

  function parseField() {
    if (lines[pos] === '"') {
      pos++; // skip opening quote
      let field = '';
      while (pos < lines.length) {
        if (lines[pos] === '"') {
          pos++;
          if (lines[pos] === '"') { field += '"'; pos++; } // escaped quote
          else break;
        } else {
          field += lines[pos++];
        }
      }
      return field;
    }
    // unquoted field — read until comma or newline
    let field = '';
    while (pos < lines.length && lines[pos] !== ',' && lines[pos] !== '\n') {
      field += lines[pos++];
    }
    return field;
  }

  function parseLine() {
    const fields = [];
    while (pos < lines.length && lines[pos] !== '\n') {
      fields.push(parseField());
      if (pos < lines.length && lines[pos] === ',') pos++;
    }
    if (lines[pos] === '\n') pos++;
    return fields;
  }

  // header
  const headers = parseLine();
  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) return rows;

  while (pos < lines.length) {
    if (lines[pos] === '\n') { pos++; continue; } // skip blank lines
    const fields = parseLine();
    if (fields.every(f => f === '')) continue;
    const obj = {};
    headers.forEach((h, i) => { obj[h] = fields[i] ?? ''; });
    rows.push(obj);
  }

  return rows;
}

export class Translator {
  constructor(controlTable, normalization = null) {
    this.controlTable = controlTable;
    this.normalization = normalization;
  }

  /**
   * Apply all replacement rules to a text string in order.
   */
  translate(text, normalization = null) {
    text = normalize(text, normalization);
    for (const repl of this.controlTable) {
      text = repl.replaces(text);
    }
    return text;
  }

  /**
   * Return the set of characters in `line` not covered by any rule.
   */
  getUnknownChars(line, normalization = null) {
    line = normalize(line, normalization);
    for (const repl of this.controlTable) {
      line = repl.removes(line);
    }
    line = line.replace(/\s+/gu, '');
    return new Set([...line]);
  }

  /**
   * Return the set of Replacement rules that match at least one character in `line`.
   */
  getKnownChars(line, normalization = null, ignore = new Set()) {
    line = normalize(line, normalization);
    const known = new Set();
    for (const repl of this.controlTable) {
      if (!ignore.has(repl.char) && repl.isIn(line)) {
        known.add(repl);
      }
    }
    return known;
  }

  /**
   * Parse a CSV string into a Translator, applying optional Unicode normalization
   * to char and replacement values exactly as the Python implementation does.
   */
  static parse(csvString, normalization = null) {
    const rows = parseCSV(csvString);
    const rules = [];

    for (const row of rows) {
      let char = normalizedChar(row.char ?? '', normalization);
      let replacement = normalizedChar(row.replacement ?? '', normalization);

      let isRegex = (row.regex ?? '').toLowerCase() === 'true';
      let isAllow = (row.allow ?? '').toLowerCase() === 'true';

      if (!isAllow && char.startsWith('#r#')) {
        char = char.slice(3);
        row.char = char;
        isRegex = true;
        if (replacement.startsWith('#r#')) {
          replacement = replacement.slice(3);
          row.replacement = replacement;
        }
      }

      if (char === replacement) {
        isAllow = true;
        replacement = '';
        row.replacement = '';
      }

      rules.push(new Replacement({
        char,
        replacement,
        regex: isRegex,
        allow: isAllow,
        record: row,
      }));
    }

    return new Translator(rules, normalization);
  }
}
