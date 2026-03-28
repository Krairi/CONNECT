import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/src/providers/AuthProvider";
import { router } from "@/src/app/router";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}