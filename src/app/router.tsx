import { createBrowserRouter, Link } from "react-router-dom";

import LandingPage from "@/src/pages/LandingPage";
import DashboardPage from "@/src/pages/DashboardPage";
import ProfilesPage from "@/src/pages/ProfilesPage";
import NotFoundPage from "@/src/pages/NotFoundPage";
import ProtectedRoute from "@/src/components/common/ProtectedRoute";
import { ROUTES } from "@/src/constants/routes";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-xs uppercase tracking-[0.35em] text-gold">
          DOMYLI
        </div>
        <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
        <p className="mt-5 text-alabaster/70 leading-8">
          Cette page est temporairement neutralisée pour remettre CONNECT en
          production sans casser le design ni le parcours principal.
        </p>
        <Link
          to={ROUTES.DASHBOARD}
          className="mt-8 inline-block border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute requireHousehold>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.PROFILES,
    element: (
      <ProtectedRoute requireHousehold>
        <ProfilesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.STATUS,
    element: (
      <ProtectedRoute requireHousehold>
        <PlaceholderPage title="Status" />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.CAPACITY,
    element: (
      <ProtectedRoute requireHousehold>
        <PlaceholderPage title="Capacity" />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.INVENTORY,
    element: (
      <ProtectedRoute requireHousehold>
        <PlaceholderPage title="Inventory" />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.SHOPPING,
    element: (
      <ProtectedRoute requireHousehold>
        <PlaceholderPage title="Shopping" />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.MEALS,
    element: (
      <ProtectedRoute requireHousehold>
        <PlaceholderPage title="Meals" />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.TASKS,
    element: (
      <ProtectedRoute requireHousehold>
        <PlaceholderPage title="Tasks" />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.TOOLS,
    element: (
      <ProtectedRoute requireHousehold>
        <PlaceholderPage title="Tools" />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);