import { client } from './client';
import type { Token, User } from './types';

export async function register(email: string, password: string): Promise<User> {
  const { data } = await client.post<User>('/api/auth/register', { email, password });
  return data;
}

export async function login(email: string, password: string): Promise<Token> {
  const { data } = await client.post<Token>('/api/auth/login', { email, password });
  return data;
}

export async function me(): Promise<User> {
  const { data } = await client.get<User>('/api/auth/me');
  return data;
}
