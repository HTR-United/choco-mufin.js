/**
 * Converts Python regex replacement syntax to JavaScript replacement syntax.
 * Python regex module: \g<0> (full match), \g<N> (group N), \N (group N)
 * JavaScript String.replace: $& (full match), $N (group N)
 */
function convertPythonBackrefs(repl) {
  return repl
    .replace(/\\g<0>/g, '$$&')
    .replace(/\\g<(\d+)>/g, '$$$1')
    .replace(/\\(\d+)/g, '$$$1');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class Replacement {
  constructor({ char, replacement, regex = false, allow = false, record = {} } = {}) {
    this.char = char;
    this.replacement = replacement;
    this.regex = regex;
    this._allow = allow;
    this.record = record;
  }

  get allow() {
    return this._allow || this.char === this.replacement;
  }

  charRepr() {
    return this.regex ? '<regex>' + this.char : this.char;
  }

  _pattern() {
    return this.regex ? this.char : escapeRegex(this.char);
  }

  isIn(string) {
    return new RegExp(this._pattern(), 'u').test(string);
  }

  findall(string) {
    return [...string.matchAll(new RegExp(this._pattern(), 'gu'))].map(m => m[0]);
  }

  removes(string) {
    return string.replace(new RegExp(this._pattern(), 'gu'), '');
  }

  replaces(string) {
    if (this.allow) return string;
    const jsReplacement = convertPythonBackrefs(this.replacement);
    return string.replace(new RegExp(this._pattern(), 'gu'), jsReplacement);
  }

  asDict() {
    const record = { ...this.record };

    if (!('char' in record)) record.char = this.char;
    if (!('replacement' in record)) record.replacement = this.replacement;
    if (!('regex' in record)) record.regex = this.regex ? 'true' : '';

    if (typeof record.char === 'string' && record.char.startsWith('#r#')) {
      record.char = this.char;
      record.regex = 'true';
      record.replacement = this.replacement;
    }

    if (this.allow) {
      record.allow = 'true';
      record.replacement = '';
    }

    return record;
  }
}
