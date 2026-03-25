import type { AdminMetric } from "@/src/types/admin";

export function useAdminOverview() {
  return {
    data: {
      metrics: [] as AdminMetric[],
    },
    loading: false,
    error: null,
    refresh: () => {},
  };
}
