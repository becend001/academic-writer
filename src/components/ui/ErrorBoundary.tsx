"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
            <div className="text-center p-8">
              <div className="text-4xl mb-4">😵</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--gray-900)" }}>
                页面出了点问题
              </h2>
              <p className="mb-4" style={{ color: "var(--gray-500)" }}>
                请刷新页面重试，或返回首页
              </p>
              <a
                href="/"
                className="px-6 py-2 rounded-lg font-semibold text-white"
                style={{ background: "var(--brand-600)" }}
              >
                返回首页
              </a>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
