import { Link } from "react-router-dom";
import { ROUTES } from "@/src/constants/routes";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="text-xs uppercase tracking-[0.35em] text-amber-300">
          DOMYLI
        </div>
        <h1 className="mt-4 text-4xl font-semibold">Page introuvable</h1>
        <p className="mt-4 text-white/70 leading-8">
          Cette route n’existe pas dans l’état actuel du front restauré.
        </p>
        <Link
          to={ROUTES.HOME}
          className="mt-8 inline-block border border-amber-300/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-amber-300 hover:bg-amber-300 hover:text-black transition-colors"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}