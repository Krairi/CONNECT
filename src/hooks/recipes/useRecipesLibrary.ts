export function useRecipesLibrary() {
  return {
    items: [],
    filters: { query: "", status: "", country: "", mealType: "" },
    setFilters: () => {},
    loading: false,
    error: null,
    refresh: () => {},
  };
}
