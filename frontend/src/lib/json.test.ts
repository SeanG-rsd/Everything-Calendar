import { parseJsonSafe } from './json';

describe('parseJsonSafe', () => {
  it('treats empty/whitespace input as an empty object', () => {
    expect(parseJsonSafe('')).toEqual({ ok: true, value: {} });
    expect(parseJsonSafe('   ')).toEqual({ ok: true, value: {} });
  });

  it('parses a valid JSON object', () => {
    expect(parseJsonSafe('{"a": 1}')).toEqual({ ok: true, value: { a: 1 } });
  });

  it('rejects malformed JSON', () => {
    expect(parseJsonSafe('{not json').ok).toBe(false);
  });

  it('rejects JSON that is not an object (arrays, primitives, null)', () => {
    expect(parseJsonSafe('[1,2,3]').ok).toBe(false);
    expect(parseJsonSafe('"just a string"').ok).toBe(false);
    expect(parseJsonSafe('42').ok).toBe(false);
    expect(parseJsonSafe('null').ok).toBe(false);
  });
});
