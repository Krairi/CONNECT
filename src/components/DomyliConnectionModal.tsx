type DomyliConnectionModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  secondaryLabel?: string;
  onConfirm: () => void;
  onSecondary?: () => void;
};

export default function DomyliConnectionModal({
  open,
  title = "Connexion requise",
  message = "Connectez-vous pour accéder à votre foyer, à vos profils et au pilotage DOMYLI.",
  confirmLabel = "Se connecter",
  secondaryLabel = "Plus tard",
  onConfirm,
  onSecondary,
}: DomyliConnectionModalProps) {
  if (!open) return null;

  return (
    <div className="domyli-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="domyli-connection-title">
      <div className="domyli-modal relative overflow-hidden">
        <div className="domyli-grain absolute inset-0" />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="domyli-orbit-dot animate-domyli-pulse" />
            <span className="domyli-eyebrow">DOMYLI • Accès au foyer</span>
          </div>

          <div className="space-y-3">
            <h2 id="domyli-connection-title" className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
              {title}
            </h2>
            <p className="text-sm leading-6 text-slate-300 sm:text-base">{message}</p>
          </div>

          <div className="domyli-alert domyli-alert-info">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/85">
              Pourquoi cette étape
            </p>
            <p className="mt-2 text-sm leading-6 text-sky-50/90">
              DOMYLI relie votre session à votre foyer actif pour afficher des repas, des tâches, du stock et des
              actions réellement personnalisés.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button type="button" onClick={onConfirm} className="domyli-button-primary">
              {confirmLabel}
            </button>
            {onSecondary ? (
              <button type="button" onClick={onSecondary} className="domyli-button-secondary">
                {secondaryLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}