export function useAdminAccess() {
  return {
    permissions: { isSuperAdmin: true },
    loading: false,
  };
}
