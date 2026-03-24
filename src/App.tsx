import { RouterProvider } from "react-router-dom";
import { router } from "@/src/app/router";
import OfflineBanner from "@/src/components/system/OfflineBanner";
import MaintenanceBanner from "@/src/components/system/MaintenanceBanner";
export default function App() { return <><div className="px-4 pt-4"><MaintenanceBanner /></div><RouterProvider router={router} /><OfflineBanner /></>; }
