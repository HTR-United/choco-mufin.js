/**
 * Browser-side XML parsers for ALTO and PAGE formats.
 * Uses DOMParser / XMLSerializer (available in all modern browsers).
 */

class BaseParser {
  constructor(xmlString, filename) {
    this.filename = filename;
    this.doc = new DOMParser().parseFromString(xmlString, 'application/xml');
    const err = this.doc.querySelector('parsererror');
    if (err) throw new Error(`XML parse error in ${filename}: ${err.textContent.slice(0, 120)}`);
    this.log = []; // { lineId, before, after }
  }

  addLog(lineId, before, after) {
    this.log.push({ lineId, before, after });
  }

  _logComment() {
    const changes = this.log.filter(e => e.before !== e.after);
    if (!changes.length) return '<!-- CHOCOMUFIN: no changes -->';
    const body = changes
      .map(e => `  [${e.lineId || '?'}] "${e.before}" → "${e.after}"`)
      .join('\n');
    return `<!-- CHOCOMUFIN CONVERSION\n  ${changes.length} line(s) changed\n${body}\n-->`;
  }

  serialize() {
    const raw = new XMLSerializer().serializeToString(this.doc);
    const decl = raw.startsWith('<?xml') ? '' : '<?xml version="1.0" encoding="UTF-8"?>\n';
    const comment = this._logComment() + '\n';
    // Insert comment right before the root element (after any existing declaration)
    if (decl) return decl + comment + raw;
    return raw.replace(/^(<\?xml[^?]*\?>)/, `$1\n${comment}`);
  }

  _nearestTextLine(el) {
    let p = el.parentElement;
    while (p && p.localName !== 'TextLine') p = p.parentElement;
    return p;
  }
}

export class AltoParser extends BaseParser {
  *getLines() {
    for (const el of this.doc.getElementsByTagNameNS('*', 'String')) {
      const text = el.getAttribute('CONTENT');
      if (text === null) continue;
      const lineEl = this._nearestTextLine(el);
      const id = lineEl?.getAttribute('ID') ?? lineEl?.getAttribute('id') ?? '';
      yield { id, text, element: el };
    }
  }

  setContent(element, text) {
    element.setAttribute('CONTENT', text);
  }
}

export class PageParser extends BaseParser {
  *getLines() {
    for (const el of this.doc.getElementsByTagNameNS('*', 'Unicode')) {
      const text = el.textContent;
      const lineEl = this._nearestTextLine(el);
      const id = lineEl?.getAttribute('id') ?? lineEl?.getAttribute('ID') ?? '';
      yield { id, text, element: el };
    }
  }

  setContent(element, text) {
    element.textContent = text;
  }
}

/**
 * Detect the correct parser class from XML content.
 * Returns AltoParser, PageParser, or null.
 */
export function detectParser(xmlString) {
  if (/alto\/ns-v|<alto[\s>]/i.test(xmlString)) return AltoParser;
  if (/PAGE\/gts\/pagecontent|PcGts[\s>]/i.test(xmlString)) return PageParser;
  return null;
}
