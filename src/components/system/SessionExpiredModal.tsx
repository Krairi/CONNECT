type Props = {
  open: boolean;
  onReconnect: () => void;
};

export default function SessionExpiredModal({ open, onReconnect }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md glass metallic-border rounded-[2rem] p-8 text-alabaster shadow-2xl">
        <div className="text-xs uppercase tracking-[0.35em] text-gold">
          Session
        </div>

        <h2 className="mt-3 text-2xl font-semibold">
          Votre session a expiré
        </h2>

        <p className="mt-4 text-sm leading-7 text-alabaster/70">
          Reconnectez-vous pour reprendre l’accès sécurisé à votre espace DOMYLI.
        </p>

        <button
          type="button"
          onClick={onReconnect}
          className="mt-8 w-full border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
        >
          Reconnexion
        </button>
      </div>
    </div>
  );
}