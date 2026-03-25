import AdminMetricCard from "@/src/components/admin/AdminMetricCard";
import AdminShell from "@/src/components/admin/AdminShell";
import EmptyState from "@/src/components/system/EmptyState";
import ErrorState from "@/src/components/system/ErrorState";
import LoadingScreen from "@/src/components/system/LoadingScreen";
import { useAdminOverview } from "@/src/hooks/admin/useAdminOverview";
import { getPageState } from "@/src/hooks/shared/usePageState";
import { getUserFacingErrorMessage } from "@/src/lib/errorMessages";
export default function AdminHomePage() { const { data, loading, error, refresh } = useAdminOverview(); const state = getPageState({ loading, error, isEmpty: data.metrics.length === 0 }); return <AdminShell title="Vue globale" subtitle="Pilotage synthétique de la plateforme DOMYLI.">{state === "loading" ? <LoadingScreen title="Administration" message="Chargement des indicateurs..." /> : null}{state === "error" ? <ErrorState message={getUserFacingErrorMessage(error)} retry={refresh} /> : null}{state === "empty" ? <EmptyState title="Aucun indicateur" description="Aucune donnée admin n’est encore disponible." /> : null}{state === "ready" ? <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">{data.metrics.map((metric) => <AdminMetricCard key={metric.label} metric={metric} />)}</div> : null}</AdminShell>; }
