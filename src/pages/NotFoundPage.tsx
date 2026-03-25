import { Link } from "react-router-dom";
import { ROUTES } from "@/src/constants/routes";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="text-xs uppercase tracking-[0.35em] text-gold">
          DOMYLI
        </div>
        <h1 className="mt-4 text-4xl font-semibold">Page introuvable</h1>
        <p className="mt-4 text-alabaster/70 leading-8">
          Cette route n’existe pas dans l’état actuel du front restauré.
        </p>
        <Link
          to={ROUTES.HOME}
          className="mt-8 inline-block border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}