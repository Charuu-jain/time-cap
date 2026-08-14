'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { trackEvent } from '../utils/analytics';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    trackEvent('app_crash', {
      error: error.message,
      info: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              ⚠️
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Something went wrong
            </h1>
            <p className="text-zinc-500 text-sm break-all">
              {this.state.errorMsg ||
                'An unexpected error occurred in the application.'}
            </p>
            <button
              className="mt-6 px-6 py-2.5 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors w-full"
              onClick={() => {
                this.setState({ hasError: false, errorMsg: '' });
                window.location.reload();
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
