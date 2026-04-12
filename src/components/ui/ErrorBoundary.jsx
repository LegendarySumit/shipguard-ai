import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (window.Sentry?.captureException) {
      window.Sentry.captureException(error, {
        extra: { componentStack: info?.componentStack || '' },
      });
    } else {
      console.error('UI crash captured by ErrorBoundary:', error, info);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-lg text-center">
            <h1 className="text-2xl font-black text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-slate-600">
              We logged the error automatically. Please refresh and try again.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary mt-6 inline-flex items-center justify-center"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
