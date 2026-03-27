import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("DOMYLI AppErrorBoundary captured an error:", error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="domyli-page-shell">
        <div className="domyli-container flex min-h-screen items-center justify-center py-10">
          <div className="domyli-error-state relative max-w-2xl overflow-hidden">
            <div className="domyli-grain absolute inset-0" />
            <div className="relative z-10 flex w-full flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="domyli-orbit-dot animate-domyli-pulse" />
                <span className="domyli-eyebrow">DOMYLI • Continuité de service</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                  Une erreur a interrompu l’interface.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  DOMYLI a détecté une anomalie inattendue. L’objectif est de restaurer rapidement une
                  expérience stable sans compromettre votre parcours.
                </p>
              </div>

              {this.state.error?.message ? (
                <div className="domyli-alert domyli-alert-danger">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200/80">
                    Diagnostic technique
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-50/90">{this.state.error.message}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <button type="button" onClick={this.handleReload} className="domyli-button-primary">
                  Recharger DOMYLI
                </button>
                <a href="/" className="domyli-button-secondary">
                  Revenir à l’accueil
                </a>
              </div>

              <div className="domyli-divider" />

              <p className="text-xs leading-5 text-slate-400">
                Si le problème persiste, reprenez le parcours depuis l’accueil puis reconnectez-vous à votre
                foyer.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}