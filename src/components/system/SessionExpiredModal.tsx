import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  onReconnect: () => void;
};

export default function SessionExpiredModal({ open, onReconnect }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-white/10 bg-[#0A0A0B] p-8 text-alabaster text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-6">
          <AlertTriangle className="text-red-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif mb-3">Session expirée</h2>
        <p className="text-sm text-alabaster/70 mb-8">
          Votre session DOMYLI a expiré. Veuillez vous reconnecter pour continuer.
        </p>
        <button
          onClick={onReconnect}
          className="w-full bg-gold px-5 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90"
        >
          Se reconnecter
        </button>
      </div>
    </div>
  );
}
