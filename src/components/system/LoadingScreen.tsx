type Props = { title?: string; message?: string };
export default function LoadingScreen({ title = "Chargement", message = "DOMYLI prépare votre espace." }: Props) { return <div className="glass metallic-border rounded-3xl p-6 text-alabaster"><p className="text-gold uppercase tracking-[0.2em] text-sm">{title}</p><p className="text-alabaster/70 mt-2">{message}</p></div>; }
