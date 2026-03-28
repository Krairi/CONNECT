import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/src/components/common/ProtectedRoute";
import { ROUTES } from "@/src/constants/routes";

import LandingPage from "@/src/pages/LandingPage";
import NotFoundPage from "@/src/pages/NotFoundPage";
import DashboardPage from "@/src/pages/DashboardPage";
import ProfilesPage from "@/src/pages/ProfilesPage";
import InventoryPage from "@/src/pages/InventoryPage";
import ShoppingPage from "@/src/pages/ShoppingPage";
import MealsPage from "@/src/pages/MealsPage";
import TasksPage from "@/src/pages/TasksPage";
import CapacityPage from "@/src/pages/CapacityPage";
import ToolsPage from "@/src/pages/ToolsPage";
import StatusPage from "@/src/pages/StatusPage";
import HouseholdActivationPage from "@/src/pages/HouseholdActivationPage";
import RecipesPage from "@/src/pages/RecipesPage";
import AdminCatalogPage from "@/src/pages/AdminCatalogPage";

function withSession(element: React.ReactElement) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

function withHousehold(element: React.ReactElement) {
  return <ProtectedRoute requireHousehold>{element}</ProtectedRoute>;
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
    path: ROUTES.tasks,
    element: withHousehold(<TasksPage />),
  },
  {
    path: ROUTES.capacity,
    element: withHousehold(<CapacityPage />),
  },
  {
    path: ROUTES.tools,
    element: withHousehold(<ToolsPage />),
  },
  {
    path: ROUTES.status,
    element: withHousehold(<StatusPage />),
  },
  {
    path: ROUTES.adminCatalog,
    element: withHousehold(<AdminCatalogPage />),
  },
  {
    path: ROUTES.notFound,
    element: <NotFoundPage />,
  },
]);