import React, { type PropsWithChildren } from "react";

type State = {
  hasError: boolean;
  errorMessage: string | null;
};

export class AppErrorBoundary extends React.Component<PropsWithChildren, State> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message ?? "Erreur inattendue",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("DOMYLI front crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
          <div className="max-w-xl text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-amber-300">
              DOMYLI
            </div>
            <h1 className="mt-4 text-3xl font-semibold">
              Une erreur a interrompu l’application
            </h1>
            <p className="mt-4 text-white/70 leading-7">
              Recharge la page pour repartir proprement.
            </p>
            {this.state.errorMessage ? (
              <div className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                {this.state.errorMessage}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}