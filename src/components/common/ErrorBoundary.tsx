import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StorageService } from '../../utils/storage';
import { ToothIcon } from './ToothIcon';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Portal Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    StorageService.clearCurrentUser();
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/signin';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F3EF] text-[#252525] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white/90 border border-red-200 rounded-3xl p-8 shadow-xl backdrop-blur-md text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <ToothIcon size={24} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-[#252525]">
                Something went wrong loading this portal.
              </h2>
              <p className="text-xs text-[#6F6D69] font-medium leading-relaxed">
                An unexpected runtime error occurred while rendering the portal view.
              </p>
            </div>

            {/* Development-only error detail */}
            {this.state.error && (
              <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-[11px] font-mono font-bold text-red-800 break-words">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[9px] font-mono text-red-600 mt-1 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 px-5 bg-[#252525] hover:bg-black text-white font-extrabold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
