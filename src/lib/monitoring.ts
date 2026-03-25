type MonitoringLevel = "info" | "warn" | "error";

type MonitoringEvent = {
  level: MonitoringLevel;
  event: string;
  message: string;
  meta?: Record<string, unknown>;
};

const monitoringEnabled =
  import.meta.env.VITE_ENABLE_MONITORING === "true";

export function reportMonitoringEvent(event: MonitoringEvent) {
  if (!monitoringEnabled) return;

  const payload = {
    ts: new Date().toISOString(),
    ...event,
  };

  if (event.level === "error") {
    console.error("[DOMYLI_MONITORING]", payload);
    return;
  }

  if (event.level === "warn") {
    console.warn("[DOMYLI_MONITORING]", payload);
    return;
  }

  console.info("[DOMYLI_MONITORING]", payload);
}