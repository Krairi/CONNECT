import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import RecipesLibraryPage from "@/src/pages/recipes/RecipesLibraryPage";
vi.mock("@/src/hooks/recipes/useRecipesLibrary", () => ({ useRecipesLibrary: () => ({ items: [], filters: { query: "", status: "", country: "", mealType: "" }, setFilters: vi.fn(), loading: false, error: null, refresh: vi.fn() }) }));
describe("RecipesLibraryPage", () => { it("renders title", () => { render(<RecipesLibraryPage />); expect(screen.getByText("Recettes")).toBeInTheDocument(); }); });
