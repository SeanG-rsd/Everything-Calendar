import axios, { AxiosError, type AxiosResponse } from 'axios';
import { parseApiError } from './client';

function makeAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = { status, data } as AxiosResponse;
  return error;
}

describe('parseApiError', () => {
  it('uses a plain string detail as-is (401/404/409 shape)', () => {
    const error = makeAxiosError(404, { detail: 'Module not found' });
    expect(parseApiError(error)).toEqual({ status: 404, detail: 'Module not found' });
  });

  it('joins FastAPI 422 validation error arrays into a readable string', () => {
    const error = makeAxiosError(422, {
      detail: [{ loc: ['body', 'email'], msg: 'field required', type: 'missing' }],
    });
    expect(parseApiError(error)).toEqual({ status: 422, detail: 'email: field required' });
  });

  it('falls back to a network error message when there is no response', () => {
    const error = new AxiosError('Network Error');
    expect(parseApiError(error)).toEqual({
      status: 0,
      detail: 'Network error — check that the backend is running.',
    });
  });

  it('falls back to a generic message for non-axios errors', () => {
    expect(axios.isAxiosError(new Error('boom'))).toBe(false);
    expect(parseApiError(new Error('boom'))).toEqual({
      status: 0,
      detail: 'An unexpected error occurred.',
    });
  });
});
