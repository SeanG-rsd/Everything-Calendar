import { isToday, localDateKey } from '../dates';

describe('localDateKey', () => {
  it('formats a zero-padded local YYYY-MM-DD key', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 10, 23))).toBe('2026-11-23');
  });
});

describe('isToday', () => {
  it('is true for a timestamp from today and false for one from yesterday', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    expect(isToday(now.toISOString())).toBe(true);
    expect(isToday(yesterday.toISOString())).toBe(false);
  });
});
