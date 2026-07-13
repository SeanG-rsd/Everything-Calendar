export type JsonParseResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

export function parseJsonSafe(text: string): JsonParseResult {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ok: true, value: {} };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'Invalid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'Must be a JSON object, e.g. {"key": "value"}.' };
  }

  return { ok: true, value: parsed as Record<string, unknown> };
}
