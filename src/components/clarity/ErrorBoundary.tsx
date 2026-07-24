// Clarity — graceful error boundary so a runtime hiccup never blanks the app.
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Clarity render error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="clarity-root grid min-h-[100dvh] w-full place-items-center px-6 text-center"
          style={{ background: "radial-gradient(120% 80% at 50% -10%,#161226 0%,#050507 55%,#000 100%)" }}
        >
          <div className="anim-popIn flex flex-col items-center">
            <div
              className="grid h-16 w-16 place-items-center rounded-[20px] text-[28px]"
              style={{ background: "var(--spice-grad)" }}
            >
              ⟳
            </div>
            <div className="mt-6 text-[22px] font-extrabold tracking-[-0.5px]">Something slipped</div>
            <div className="mt-2 max-w-[280px] text-[15px] leading-[1.5] text-[hsl(var(--muted-foreground))]">
              Clarity hit a snag. Give it another go.
            </div>
            <button
              onClick={this.handleReset}
              className="mt-7 rounded-[16px] px-7 py-3.5 text-[15px] font-bold text-white"
              style={{ background: "var(--spice-grad)" }}
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
