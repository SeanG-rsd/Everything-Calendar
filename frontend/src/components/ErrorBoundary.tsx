import React from 'react';
import { ScrollView, Text } from 'react-native';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Caught render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#0E1116' }}
          contentContainerStyle={{ padding: 24, paddingTop: 64 }}
        >
          <Text style={{ color: '#f66', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Startup error (diagnostic)
          </Text>
          <Text style={{ color: '#fff', fontSize: 13 }}>{this.state.error.message}</Text>
          <Text style={{ color: '#888', fontSize: 11, marginTop: 16 }}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
