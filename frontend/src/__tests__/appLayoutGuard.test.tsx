import { render, screen } from '@testing-library/react-native';

const mockUseAuth = jest.fn();
jest.mock('@/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('expo-router', () => {
  const RN = require('react-native');
  function Redirect({ href }: { href: string }) {
    return <RN.Text>{`redirect:${href}`}</RN.Text>;
  }
  function Stack({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }
  Stack.Screen = () => null;
  return { Redirect, Stack };
});

import AppLayout from '../app/(app)/_layout';

describe('AppLayout route guard', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, logout: jest.fn() });
    await render(<AppLayout />);
    expect(screen.getByText('redirect:/login')).toBeTruthy();
  });

  it('renders the protected stack when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'a@example.com', is_active: true, created_at: '2026-01-01' },
      isLoading: false,
      logout: jest.fn(),
    });
    await render(<AppLayout />);
    expect(screen.queryByText(/^redirect:/)).toBeNull();
  });
});
