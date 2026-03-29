import type { ReactElement } from "react";
import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "@/src/components/common/ProtectedRoute";
import { ROUTES } from "@/src/constants/routes";

import LandingPage from "@/src/pages/LandingPage";
import NotFoundPage from "@/src/pages/NotFoundPage";
import DashboardPage from "@/src/pages/DashboardPage";
import ProfilesPage from "@/src/pages/ProfilesPage";
import InventoryPage from "@/src/pages/InventoryPage";
import ShoppingPage from "@/src/pages/ShoppingPage";
import RecipesPage from "@/src/pages/RecipesPage";
import MealsPage from "@/src/pages/MealsPage";
import ToolsPage from "@/src/pages/ToolsPage";
import TasksPage from "@/src/pages/TasksPage";
import StatusPage from "@/src/pages/StatusPage";
import CapacityPage from "@/src/pages/CapacityPage";
import HouseholdActivationPage from "@/src/pages/HouseholdActivationPage";
import PricingPage from "@/src/pages/PricingPage";
import SubscriptionPage from "@/src/pages/SubscriptionPage";
import ReadinessPage from "@/src/pages/ReadinessPage";
import AdminCatalogPage from "@/src/pages/AdminCatalogPage";
import HouseholdMembersPage from "@/src/pages/HouseholdMembersPage";
import InviteAcceptPage from "@/src/pages/InviteAcceptPage";
import MyProfilePage from "@/src/pages/MyProfilePage";

function withSession(element: ReactElement) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

function withHousehold(element: ReactElement) {
  return <ProtectedRoute requireHousehold>{element}</ProtectedRoute>;
}

function withSuperAdmin(element: ReactElement) {
  return (
    <ProtectedRoute
      requireSuperAdmin
      allowSuperAdminBypassHousehold
    >
      {element}
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <LandingPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: ROUTES.activateHousehold,
    element: withSession(<HouseholdActivationPage />),
  },
  {
    path: ROUTES.dashboard,
    element: withHousehold(<DashboardPage />),
  },
  {
    path: ROUTES.householdMembers,
    element: withHousehold(<HouseholdMembersPage />),
  },
  {
    path: ROUTES.inviteAccept,
    element: withSession(<InviteAcceptPage />),
  },
  {
    path: ROUTES.myProfile,
    element: withHousehold(<MyProfilePage />),
  },
  {
    path: ROUTES.profiles,
    element: withHousehold(<ProfilesPage />),
  },
  {
    path: ROUTES.inventory,
    element: withHousehold(<InventoryPage />),
  },
  {
    path: ROUTES.shopping,
    element: withHousehold(<ShoppingPage />),
  },
  {
    path: ROUTES.recipes,
    element: withHousehold(<RecipesPage />),
  },
  {
    path: ROUTES.meals,
    element: withHousehold(<MealsPage />),
  },
  {
    path: ROUTES.tools,
    element: withHousehold(<ToolsPage />),
  },
  {
    path: ROUTES.tasks,
    element: withHousehold(<TasksPage />),
  },
  {
    path: ROUTES.status,
    element: withHousehold(<StatusPage />),
  },
  {
    path: ROUTES.capacity,
    element: withHousehold(<CapacityPage />),
  },
  {
    path: ROUTES.subscription,
    element: withHousehold(<SubscriptionPage />),
  },
  {
    path: ROUTES.readiness,
    element: withHousehold(<ReadinessPage />),
  },
  {
    path: ROUTES.pricing,
    element: <PricingPage />,
  },
  {
    path: ROUTES.adminCatalog,
    element: withSuperAdmin(<AdminCatalogPage />),
  },
  {
    path: ROUTES.notFound,
    element: <NotFoundPage />,
  },
]);