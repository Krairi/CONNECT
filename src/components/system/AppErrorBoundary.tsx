import React, { type PropsWithChildren } from "react";
import { reportMonitoringEvent } from "@/src/lib/monitoring";

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
    reportMonitoringEvent({
      level: "error",
      event: "frontend_crash",
      message: error.message,
      meta: {
        componentStack: info.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
          <div className="max-w-xl text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-gold">
              DOMYLI
            </div>

            <h1 className="mt-4 text-3xl font-semibold">
              Une erreur a interrompu l’application
            </h1>

            <p className="mt-4 text-alabaster/70 leading-7">
              Recharge la page pour relancer le service. Si le problème persiste,
              applique le runbook d’exploitation.
            </p>

            {this.state.errorMessage ? (
              <div className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                {this.state.errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Recharger l’application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}