"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  sectionName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundaryClass extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.sectionName ?? "Section"}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const name = this.props.sectionName || "this section";
      return (
        <div className="w-full p-8 rounded-2xl bg-[#141417] border border-red-500/20 text-center my-6">
          <h3 className="text-lg font-bold text-red-400 mb-2">Something went wrong in {name}</h3>
          <p className="text-sm text-white/50 mb-4">{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-[#EE5F96] hover:bg-[#d94d7e] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#EE5F96]/60"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children, sectionName, fallback }: Props) {
  return (
    <ErrorBoundaryClass sectionName={sectionName} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}
