# Choco-Mufin.js

*[CHaracter Ocr COordination for MUFI iN texts — JavaScript/browser edition]*

A browser-side ESM library and web application for normalizing the use of characters and checking file consistencies in medieval text transcriptions. Mainly targeted at dealing with overly diverse ways to transcribe medieval data (allographic and graphematic) while keeping information such as abbreviations, hence MUFI.

This is the JavaScript port of the Python [choco-mufin](https://github.com/PonteIneptique/choco-mufin) CLI tool. It runs entirely in the browser — no server, no upload.

## Web Application

Open `index.html` for the **Table Editor** and `convert.html` for **Check / Convert**.

### Table Editor (`index.html`)

- Choose a Unicode normalization form (NFD, NFC, NFKD, NFKC, or none)
- Start a new table from character-range presets, or load an existing CSV
- Discover uncovered characters by dropping ALTO / PAGE XML files
- Edit rules individually: allow, replace, or skip each character
- Export the table as CSV

### Check / Convert (`convert.html`)

- **Check**: scan XML files against your table and highlight every uncovered character
- **Convert & Download**: apply all replacement rules and download the converted files as a ZIP preserving the original folder structure

## Table of conversion

### Syntax

A conversion table **must** contain at least a `char` and a `replacement` column, **should** contain `regex` and `allow` columns (with either `true` or empty values), and **may** contain any additional columns.

| Column | Effect |
|--------|--------|
| `char` | The character or pattern to match |
| `replacement` | What to replace it with (empty = remove) |
| `regex` | If `true`, `char` and `replacement` are treated as regular expressions |
| `allow` | If `true`, the character is accepted as-is and `replacement` is ignored |

Any other column is treated as documentation metadata and has no effect on processing.

### Example

```csv
char,replacement,regex,allow
V,U,,
[a-ik-uw-zA-IK-UW-Z],,true,true
(\S)(\.)(\S),\g<1>\g<2> \g<3>,true,
_,,,true
```

- Line 1 replaces any `V` with `U`
- Line 2 allows any character in the defined range (accepted as-is)
- Line 3 inserts a space around isolated dots using regex back-references
- Line 4 allows `_` without replacing it

The `#r#` prefix on a `char` value is an alternative way to mark a regex rule (for compatibility with the Python tool).

## Library usage (ESM)

```js
import { Translator, Replacement } from './src/index.js';

// Parse a CSV table
const translator = Translator.parse(csvString, 'NFD');

// Translate a line
const out = translator.translate('ẏour text here', 'NFD');

// Find uncovered characters
const unknown = translator.getUnknownChars('ẏour text here', 'NFD');
```

## Development

```bash
npm install
npm run dev      # dev server with hot reload
npm test         # run tests with Vitest
npm run build    # build to dist/
```

## Relation to the Python CLI

The Python [choco-mufin](https://github.com/PonteIneptique/choco-mufin) package provides the same logic as a command-line tool and supports batch processing via shell scripts or GitHub Actions. The JS library is API-compatible: CSV tables produced by either tool can be loaded by the other.

---

Logo by [Alix Chagué](https://alix-tz.github.io).

The MUFI character data used in related resources is under `CC BY-SA 4.0` and comes from https://mufi.info.

## Funding

Funded in the context of the **ATRIUM RESEARCH** project. Funded by the European Union under Grant Agreement n. 101132163. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union. Neither the European Union nor the granting authority can be held responsible for them.
