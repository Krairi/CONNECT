type MonitoringPayload = { level: "info" | "warn" | "error"; event: string; message?: string; meta?: Record<string, unknown> };
const enabled = import.meta.env.VITE_ENABLE_MONITORING === "true";
export function reportMonitoringEvent(payload: MonitoringPayload) { if (!enabled) return; if (payload.level === "error") return console.error("[DOMYLI_MONITORING]", payload); if (payload.level === "warn") return console.warn("[DOMYLI_MONITORING]", payload); console.info("[DOMYLI_MONITORING]", payload); }
