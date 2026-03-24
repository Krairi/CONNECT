/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import ProfilesPage from "./pages/ProfilesPage";
import DashboardPage from "./pages/DashboardPage";
import StatusPage from "./pages/StatusPage";
import CapacityPage from "./pages/CapacityPage";
import InventoryPage from "./pages/InventoryPage";
import ShoppingPage from "./pages/ShoppingPage";
import MealsPage from "./pages/MealsPage";
import TasksPage from "./pages/TasksPage";
import ToolsPage from "./pages/ToolsPage";

function getCurrentPath() {
  return window.location.pathname || "/";
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath());

  useEffect(() => {
    const onPopState = () => {
      setPath(getCurrentPath());
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  switch (path) {
    case "/profiles":
      return <ProfilesPage />;

    case "/dashboard":
      return <DashboardPage />;

    case "/status":
      return <StatusPage />;

    case "/capacity":
      return <CapacityPage />;

    case "/inventory":
      return <InventoryPage />;

    case "/shopping":
      return <ShoppingPage />;

    case "/meals":
      return <MealsPage />;

    case "/tasks":
      return <TasksPage />;

    case "/tools":
      return <ToolsPage />;

    case "/":
    default:
      return <LandingPage />;
  }
}