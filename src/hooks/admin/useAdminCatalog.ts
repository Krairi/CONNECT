export function useAdminCatalog() {
  return {
    data: {
      recipesCount: 0,
      tasksCount: 0,
      draftRecipesCount: 0,
      draftTasksCount: 0,
    },
    loading: false,
    error: null,
  };
}
