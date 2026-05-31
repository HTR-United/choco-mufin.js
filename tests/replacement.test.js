import { describe, it, expect } from 'vitest';
import { Replacement } from '../src/replacement.js';

describe('Replacement.allow', () => {
  it('is true when _allow flag is set', () => {
    const r = new Replacement({ char: 'a', replacement: 'b', allow: true });
    expect(r.allow).toBe(true);
  });

  it('is true when char equals replacement', () => {
    const r = new Replacement({ char: 'a', replacement: 'a' });
    expect(r.allow).toBe(true);
  });

  it('is false when char differs and _allow is not set', () => {
    const r = new Replacement({ char: 'a', replacement: 'b' });
    expect(r.allow).toBe(false);
  });
});

describe('Replacement.isIn', () => {
  it('finds a literal character', () => {
    const r = new Replacement({ char: 'a', replacement: 'b' });
    expect(r.isIn('abba')).toBe(true);
    expect(r.isIn('cdef')).toBe(false);
  });

  it('finds a regex pattern', () => {
    const r = new Replacement({ char: '[a-z]', replacement: '', regex: true });
    expect(r.isIn('hello')).toBe(true);
    expect(r.isIn('123')).toBe(false);
  });
});

describe('Replacement.removes', () => {
  it('removes literal characters', () => {
    const r = new Replacement({ char: 'a', replacement: 'b' });
    expect(r.removes('abba')).toBe('bb');
  });

  it('removes regex matches', () => {
    const r = new Replacement({ char: '[ab]', replacement: '', regex: true });
    expect(r.removes('abba')).toBe('');
  });
});

describe('Replacement.replaces', () => {
  it('replaces a literal character', () => {
    const r = new Replacement({ char: 'a', replacement: 'b' });
    expect(r.replaces('abba')).toBe('bbbb');
  });

  it('is a no-op when allow is true', () => {
    const r = new Replacement({ char: 'a', replacement: 'a' });
    expect(r.replaces('abba')).toBe('abba');
  });

  it('replaces with a regex backreference \\g<0> (full match)', () => {
    // \g<0> in Python → $& in JS
    const r = new Replacement({ char: '[a-z]', replacement: '\\g<0>', regex: true });
    expect(r.replaces('abbaZ')).toBe('abbaZ');
  });

  it('replaces with a regex group backreference \\g<1>', () => {
    // mirrors Python: Replacement(r"(\S)([\.;:])(\S)", r"\g<1>\g<2> \g<3>")
    const r = new Replacement({
      char: String.raw`(\S)([\.;:])(\S)`,
      replacement: String.raw`\g<1>\g<2> \g<3>`,
      regex: true,
    });
    expect(r.replaces("Fin de phrase.pas d'espace")).toBe("Fin de phrase. pas d'espace");
  });

  it('treats special regex chars as literals when regex=false', () => {
    // char "[a-z]" should be matched literally, not as a regex
    const r = new Replacement({ char: '[a-z]', replacement: 'X' });
    expect(r.replaces('hello [a-z] world')).toBe('hello X world');
  });
});

describe('Replacement.charRepr', () => {
  it('prefixes <regex> for regex rules', () => {
    const r = new Replacement({ char: '[a-z]', replacement: '', regex: true });
    expect(r.charRepr()).toBe('<regex>[a-z]');
  });

  it('returns bare char for literal rules', () => {
    const r = new Replacement({ char: 'a', replacement: 'b' });
    expect(r.charRepr()).toBe('a');
  });
});
