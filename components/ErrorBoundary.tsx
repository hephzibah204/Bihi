import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Fix: Converted the component to a class that extends React.Component. An ErrorBoundary must be a class component to use getDerivedStateFromError or componentDidCatch.
class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = {
    hasError: false,
    error: undefined
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
          {this.state.error && <pre style={{ marginTop: '1rem', background: '#f0f0f0', padding: '1rem', borderRadius: '4px', textAlign: 'left' }}>{this.state.error.toString()}</pre>}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
