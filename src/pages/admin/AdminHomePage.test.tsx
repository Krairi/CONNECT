import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import AdminHomePage from "@/src/pages/admin/AdminHomePage";
vi.mock("@/src/hooks/admin/useAdminOverview", () => ({ useAdminOverview: () => ({ data: { metrics: [{ label: "Foyers", value: 10 }] }, loading: false, error: null, refresh: vi.fn() }) }));
describe("AdminHomePage", () => { it("renders admin overview", () => { render(<MemoryRouter><AdminHomePage /></MemoryRouter>); expect(screen.getAllByText("Vue globale")[0]).toBeInTheDocument(); expect(screen.getByText("Foyers")).toBeInTheDocument(); }); });
