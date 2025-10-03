import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // Fix: Using a constructor to initialize state ensures `props` are correctly passed
  // via `super(props)`, which can resolve type issues in some build configurations where
  // class property syntax might be problematic.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-100">
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
            <p className="mt-2 text-gray-600">
              We've logged the issue. Please refresh the page to continue.
            </p>
            <button
              className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
