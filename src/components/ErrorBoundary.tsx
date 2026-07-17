import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div id="error-boundary-container" className="flex items-center justify-center min-h-[300px] p-6 bg-slate-900/5 rounded-2xl border border-dashed border-red-200 m-4">
          <div className="text-center max-w-md space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">JDay Execution Interrupted</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                The experiment viewport encountered an unexpected runtime failure. This can occur due to transient API drops or network latency.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-red-950/5 rounded-lg border border-red-200/40 text-[9px] font-mono text-red-700 text-left overflow-auto max-h-[120px] custom-scrollbar">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-extrabold uppercase text-white rounded-lg shadow-sm hover:shadow-md transition-all tracking-widest inline-flex items-center gap-1.5"
            >
              <RefreshCw size={11} /> Restart Viewport
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
