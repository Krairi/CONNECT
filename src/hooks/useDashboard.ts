import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealth,
  type TodayLoadFeed,
} from "@/src/services/dashboard/dashboardService";
import {
  getDashboardViewContext,
  type DashboardViewContext,
} from "@/src/services/dashboard/dashboardViewService";

type DashboardViewMode = "PROFILE" | "FOYER";

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: TodayHealth | null;
  feed: TodayLoadFeed;
  viewContext: DashboardViewContext | null;
  viewMode: DashboardViewMode;
  selectedProfileId: string | null;
};

const STORAGE_VIEW_MODE_KEY = "domyli.dashboardViewMode";
const STORAGE_PROFILE_ID_KEY = "domyli.profileId";

const initialState: DashboardState = {
  loading: false,
  error: null,
  health: null,
  feed: { members: [] },
  viewContext: null,
  viewMode: "FOYER",
  selectedProfileId:
    typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE_PROFILE_ID_KEY)
      : null,
};

export function useDashboard() {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(
    async (nextProfileId?: string | null) => {
      const selectedProfileId =
        nextProfileId !== undefined ? nextProfileId : state.selectedProfileId;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const [health, feed, viewContext] = await Promise.all([
          getTodayHealth(),
          getTodayLoadFeed(),
          getDashboardViewContext(selectedProfileId),
        ]);

        const persistedViewMode =
          typeof window !== "undefined"
            ? (window.localStorage.getItem(
                STORAGE_VIEW_MODE_KEY,
              ) as DashboardViewMode | null)
            : null;

        const resolvedProfileId = viewContext.selected_profile_id ?? null;
        const resolvedViewMode: DashboardViewMode =
          persistedViewMode === "PROFILE" || persistedViewMode === "FOYER"
            ? persistedViewMode
            : viewContext.default_view;

        if (typeof window !== "undefined") {
          if (resolvedProfileId) {
            window.localStorage.setItem(STORAGE_PROFILE_ID_KEY, resolvedProfileId);
          } else {
            window.localStorage.removeItem(STORAGE_PROFILE_ID_KEY);
          }

          window.localStorage.setItem(STORAGE_VIEW_MODE_KEY, resolvedViewMode);
        }

        setState({
          loading: false,
          error: null,
          health,
          feed,
          viewContext,
          viewMode:
            resolvedViewMode === "PROFILE" && !viewContext.selected_profile
              ? "FOYER"
              : resolvedViewMode,
          selectedProfileId: resolvedProfileId,
        });
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: normalized,
        }));
      }
    },
    [state.selectedProfileId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setViewMode = useCallback((mode: DashboardViewMode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_VIEW_MODE_KEY, mode);
    }

    setState((prev) => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  const selectProfile = useCallback(
    async (profileId: string | null) => {
      if (typeof window !== "undefined") {
        if (profileId) {
          window.localStorage.setItem(STORAGE_PROFILE_ID_KEY, profileId);
        } else {
          window.localStorage.removeItem(STORAGE_PROFILE_ID_KEY);
        }
        window.localStorage.setItem(STORAGE_VIEW_MODE_KEY, "PROFILE");
      }

      await refresh(profileId);

      setState((prev) => ({
        ...prev,
        viewMode: "PROFILE",
      }));
    },
    [refresh],
  );

  return {
    ...state,
    refresh,
    setViewMode,
    selectProfile,
    availableProfiles: state.viewContext?.available_profiles ?? [],
    selectedProfile: state.viewContext?.selected_profile ?? null,
    householdName: state.viewContext?.household_name ?? null,
    role: state.viewContext?.role ?? null,
  };
}