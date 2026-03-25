import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import ProtectedRoute from "@/src/components/common/ProtectedRoute";
vi.mock("@/src/providers/AuthProvider", () => ({ useAuth: () => ({ authLoading: false, bootstrapLoading: false, isAuthenticated: true }) }));
describe("ProtectedRoute", () => { it("renders children when authenticated", () => { render(<MemoryRouter><ProtectedRoute><div>Contenu privé</div></ProtectedRoute></MemoryRouter>); expect(screen.getByText("Contenu privé")).toBeInTheDocument(); }); });
