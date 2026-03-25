type MonitoringPayload = {
  level: "info" | "warn" | "error";
  event: string;
  message?: string;
  meta?: Record<string, unknown>;
};

const enabled = import.meta.env.VITE_ENABLE_MONITORING === "true";

export function reportMonitoringEvent(payload: MonitoringPayload) {
  if (!enabled) return;

  if (payload.level === "error") {
    console.error("[DOMYLI_MONITORING]", payload);
    return;
  }

  if (payload.level === "warn") {
    console.warn("[DOMYLI_MONITORING]", payload);
    return;
  }

  console.info("[DOMYLI_MONITORING]", payload);
}