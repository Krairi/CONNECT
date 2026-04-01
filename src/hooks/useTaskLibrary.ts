
import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readTaskLibrary,
  readTaskLibraryDetail,
  type TaskLibraryDetail,
  type TaskLibraryItem,
} from "@/src/services/tasks/taskLibraryService";

type TaskLibraryState = {
  loading: boolean;
  detailLoading: boolean;
  error: DomyliAppError | null;
  detailError: DomyliAppError | null;
  items: TaskLibraryItem[];
  detail: TaskLibraryDetail | null;
  zoneCode: string;
  frequencyCode: string;
  profileId: string;
  selectedTaskTemplateCode: string;
};

const initialState: TaskLibraryState = {
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  items: [],
  detail: null,
  zoneCode: "ALL",
  frequencyCode: "ALL",
  profileId: "",
  selectedTaskTemplateCode: "",
};

export function useTaskLibrary() {
  const [state, setState] = useState<TaskLibraryState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const items = await readTaskLibrary({
        zoneCode: state.zoneCode === "ALL" ? null : state.zoneCode,
        frequencyCode: state.frequencyCode === "ALL" ? null : state.frequencyCode,
        profileId: state.profileId.trim() || null,
        limit: 60,
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        items,
        selectedTaskTemplateCode:
          prev.selectedTaskTemplateCode &&
          items.some((item) => item.task_template_code === prev.selectedTaskTemplateCode)
            ? prev.selectedTaskTemplateCode
            : items[0]?.task_template_code ?? "",
        detail:
          prev.detail &&
          items.some((item) => item.task_template_code === prev.detail?.task_template_code)
            ? prev.detail
            : null,
      }));

      return items;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, loading: false, error: normalized }));
      throw normalized;
    }
  }, [state.frequencyCode, state.profileId, state.zoneCode]);

  const refreshDetail = useCallback(async () => {
    if (!state.selectedTaskTemplateCode.trim()) {
      setState((prev) => ({ ...prev, detail: null, detailError: null }));
      return null;
    }

    setState((prev) => ({ ...prev, detailLoading: true, detailError: null }));
    try {
      const detail = await readTaskLibraryDetail({
        taskTemplateCode: state.selectedTaskTemplateCode,
        contextCode: state.profileId.trim() ? "PROFILE_TARGETED" : "HOUSEHOLD",
        profileId: state.profileId.trim() || null,
      });

      setState((prev) => ({ ...prev, detailLoading: false, detail }));
      return detail;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, detailLoading: false, detailError: normalized }));
      throw normalized;
    }
  }, [state.profileId, state.selectedTaskTemplateCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!state.selectedTaskTemplateCode.trim()) {
      setState((prev) => ({ ...prev, detail: null, detailError: null }));
      return;
    }
    void refreshDetail();
  }, [refreshDetail, state.selectedTaskTemplateCode]);

  const zoneOptions = useMemo(() => {
    const values = Array.from(new Set(state.items.map((item) => item.zone_code))).filter(Boolean);
    return ["ALL", ...values];
  }, [state.items]);

  const frequencyOptions = useMemo(() => {
    const values = Array.from(new Set(state.items.map((item) => item.frequency_code))).filter(Boolean);
    return ["ALL", ...values];
  }, [state.items]);

  const summary = useMemo(() => {
    const total = state.items.length;
    const ok = state.items.filter((item) => item.fit_status === "OK").length;
    const warning = state.items.filter((item) => item.fit_status === "WARNING").length;
    const blocked = state.items.filter((item) => item.fit_status === "BLOCKED").length;
    const daily = state.items.filter((item) => item.frequency_code === "DAILY").length;
    return { total, ok, warning, blocked, daily };
  }, [state.items]);

  const selectedItem = useMemo(() => {
    return (
      state.items.find((item) => item.task_template_code === state.selectedTaskTemplateCode) ??
      state.items[0] ??
      null
    );
  }, [state.items, state.selectedTaskTemplateCode]);

  return {
    ...state,
    selectedItem,
    summary,
    zoneOptions,
    frequencyOptions,
    setZoneCode: (zoneCode: string) => setState((prev) => ({ ...prev, zoneCode })),
    setFrequencyCode: (frequencyCode: string) => setState((prev) => ({ ...prev, frequencyCode })),
    setProfileId: (profileId: string) => setState((prev) => ({ ...prev, profileId })),
    setSelectedTaskTemplateCode: (selectedTaskTemplateCode: string) =>
      setState((prev) => ({ ...prev, selectedTaskTemplateCode })),
    refresh,
    refreshDetail,
  };
}
