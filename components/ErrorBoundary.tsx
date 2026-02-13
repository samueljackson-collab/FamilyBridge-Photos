import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-12 max-w-2xl text-center shadow-2xl">
            <div className="mx-auto w-24 h-24 flex items-center justify-center bg-red-500/20 rounded-full border-4 border-red-500 mb-6">
              <i className="fas fa-exclamation-triangle text-5xl text-red-400"></i>
            </div>
            <h1 className="text-5xl font-bold text-slate-100 mb-4">Something went wrong</h1>
            <p className="text-2xl text-slate-400 mb-8">
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            {this.state.error && (
              <details className="text-left mb-8">
                <summary className="text-xl text-slate-500 cursor-pointer hover:text-slate-300">Error details</summary>
                <pre className="mt-4 p-4 bg-slate-950 rounded-xl text-lg text-red-300 overflow-auto max-h-48">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="text-3xl py-5 px-10 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
