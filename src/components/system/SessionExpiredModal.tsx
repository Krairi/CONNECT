type SessionExpiredModalProps = {
  open: boolean;
  onReconnect: () => void;
  onClose?: () => void;
};

export default function SessionExpiredModal({
  open,
  onReconnect,
  onClose,
}: SessionExpiredModalProps) {
  if (!open) return null;

  return (
    <div className="domyli-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="session-expired-title">
      <div className="domyli-modal relative overflow-hidden">
        <div className="domyli-grain absolute inset-0" />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="domyli-orbit-dot animate-domyli-pulse" />
            <span className="domyli-eyebrow">DOMYLI • Session sécurisée</span>
          </div>

          <div className="space-y-3">
            <h2 id="session-expired-title" className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
              Votre session a expiré.
            </h2>
            <p className="text-sm leading-6 text-slate-300 sm:text-base">
              Pour protéger l’accès à votre foyer et à vos données, DOMYLI vous demande de rétablir une session
              valide avant de poursuivre.
            </p>
          </div>

          <div className="domyli-alert domyli-alert-warning">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/85">
              Continuité interrompue
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-50/90">
              Vos écrans restent disponibles, mais les actions métier nécessitant un accès sécurisé sont
              temporairement bloquées.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button type="button" onClick={onReconnect} className="domyli-button-primary">
              Reconnecter la session
            </button>
            {onClose ? (
              <button type="button" onClick={onClose} className="domyli-button-secondary">
                Fermer
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}