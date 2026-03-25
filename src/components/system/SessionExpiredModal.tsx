type Props = {
  open: boolean;
  onReconnect: () => void;
};

export default function SessionExpiredModal({ open, onReconnect }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-md border border-white/10 bg-zinc-950 p-8 text-white shadow-2xl">
        <div className="text-xs uppercase tracking-[0.35em] text-amber-300">
          Session
        </div>
        <h2 className="mt-3 text-2xl font-semibold">Votre session a expiré</h2>
        <p className="mt-4 text-sm leading-7 text-white/70">
          Reconnectez-vous pour reprendre l’accès sécurisé à votre espace DOMYLI.
        </p>
        <button
          type="button"
          onClick={onReconnect}
          className="mt-8 w-full border border-amber-300/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-amber-300 hover:bg-amber-300 hover:text-black transition-colors"
        >
          Reconnexion
        </button>
      </div>
    </div>
  );
}