import { useEffect, useMemo, useRef, useState } from "react";
import { factories, models, service } from "powerbi-client";
import { fetchPowerBiEmbedConfig, getPowerBiEmbedConfigUrl } from "../../api/powerbi";

const toText = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseExpiryMs = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 1e12) return value; // ms epoch
    if (value >= 1e9) return value * 1000; // seconds epoch
    return null;
  }

  const text = toText(value);
  if (!text) return null;

  if (/^\d+(\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    if (Number.isFinite(numeric)) {
      if (numeric >= 1e12) return numeric;
      if (numeric >= 1e9) return numeric * 1000;
      return null;
    }
  }

  const ms = Date.parse(text);
  return Number.isFinite(ms) ? ms : null;
};

const getRefreshDelayMs = (expiryMs) => {
  if (!Number.isFinite(expiryMs)) return null;
  return Math.max(0, expiryMs - Date.now() - 2 * 60 * 1000);
};

const getConfigKey = (params) => JSON.stringify(params || {});

const pickEmbedRoot = (raw) => {
  if (!isObject(raw)) return null;
  const data = isObject(raw.data) ? raw.data : null;

  const candidates = [
    raw,
    data,
    raw.embedConfig,
    raw.embed,
    raw.powerbi,
    raw.powerBi,
    raw.config,
    data?.embedConfig,
    data?.embed,
    data?.powerbi,
    data?.powerBi,
    data?.config,
  ].filter(isObject);

  for (const candidate of candidates) {
    if (
      candidate.embedUrl ||
      candidate.embed_url ||
      candidate.accessToken ||
      candidate.access_token ||
      candidate.token ||
      candidate.reportId ||
      candidate.report_id
    ) {
      return candidate;
    }
  }

  return candidates[0] || raw;
};

const safeEmbedConfig = (cfg) => {
  const root = pickEmbedRoot(cfg);
  if (!root) return null;

  const reportId = toText(root.reportId || root.report_id || root.id);
  const embedUrl = toText(
    root.embedUrl ||
      root.embed_url ||
      root.reportEmbedUrl ||
      root.report_embed_url ||
      root.reportUrl ||
      root.report_url
  );
  const accessToken = toText(
    root.accessToken ||
      root.access_token ||
      root.token ||
      root.embedToken ||
      root.embed_token
  );
  const tokenExpiry = toText(
    root.tokenExpiry ||
      root.token_expiry ||
      root.expiration ||
      root.expirationTime ||
      root.expiresOn ||
      root.expires_on ||
      root.expiry
  );
  if (!reportId || !embedUrl || !accessToken) return null;
  return { reportId, embedUrl, accessToken, tokenExpiry: tokenExpiry || null };
};

export const PowerBIReportEmbed = ({
  appointmentId,
  date,
  metric,
  patientName,
  reportId,
  doctorEmail,
  doctorId,
  clinicId,
  height = "calc(100vh - 260px)",
  minHeight = 520,
}) => {
  const containerRef = useRef(null);
  const reportRef = useRef(null);
  const accessTokenRef = useRef("");

  const [embedConfig, setEmbedConfig] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const embedReportId = embedConfig?.reportId;
  const embedUrl = embedConfig?.embedUrl;
  const embedAccessToken = embedConfig?.accessToken;
  const tokenExpiry = embedConfig?.tokenExpiry;

  const requestParams = useMemo(
    () => ({
      appointmentId: toText(appointmentId),
      date: toText(date),
      metric: toText(metric),
      patientName: toText(patientName),
      reportId: toText(reportId),
      doctorEmail: toText(doctorEmail),
      doctorId: toText(doctorId),
      clinicId: toText(clinicId),
    }),
    [appointmentId, date, metric, patientName, reportId, doctorEmail, doctorId, clinicId]
  );

  const configKey = useMemo(() => getConfigKey(requestParams), [requestParams]);

  const powerbiService = useMemo(
    () =>
      new service.Service(
        factories.hpmFactory,
        factories.wpmpFactory,
        factories.routerFactory
      ),
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    setEmbedConfig(null);

    fetchPowerBiEmbedConfig(requestParams, { signal: controller.signal })
      .then((cfg) => {
        if (controller.signal.aborted) return;
        const normalized = safeEmbedConfig(cfg);
        if (!normalized) {
          setError("Power BI embed config is missing required fields.");
          setIsLoading(false);
          return;
        }
        setEmbedConfig(normalized);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        const message = e?.message ? String(e.message) : "Failed to load Power BI embed config.";
        const url = e?.url ? ` (${String(e.url)})` : "";
        setError(`${message}${url}`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [configKey, requestParams]);

  const accessToken = toText(embedConfig?.accessToken);
  const hasAccessToken = Boolean(accessToken);
  accessTokenRef.current = accessToken;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!embedUrl || !embedReportId) return;
    if (!hasAccessToken) return;

    setError("");

    let embedded;
    try {
      embedded = powerbiService.embed(container, {
        type: "report",
        id: embedReportId,
        embedUrl,
        accessToken: accessTokenRef.current,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: {
            filters: { expanded: false, visible: false },
            pageNavigation: { visible: true },
          },
        },
      });
    } catch (e) {
      setError(e?.message ? String(e.message) : "Power BI embed failed to initialize.");
      return () => {};
    }

    const handleError = (event) => {
      const message =
        event?.detail?.message ||
        event?.detail?.error?.message ||
        event?.detail?.error ||
        "Power BI report failed to load.";
      setError(String(message));
    };

    if (embedded?.on) {
      embedded.on("error", handleError);
    }

    reportRef.current = embedded;

    return () => {
      try {
        if (embedded?.off) {
          embedded.off("error", handleError);
        }
      } catch (_) {
        // ignore
      }
      powerbiService.reset(container);
      reportRef.current = null;
    };
  }, [powerbiService, embedReportId, embedUrl, hasAccessToken]);

  useEffect(() => {
    if (!embedAccessToken) return;
    if (!reportRef.current) return;
    reportRef.current.setAccessToken(String(embedAccessToken)).catch(() => {});
  }, [embedAccessToken]);

  useEffect(() => {
    const expiryMs = parseExpiryMs(tokenExpiry);
    const refreshDelayMs = getRefreshDelayMs(expiryMs);
    if (refreshDelayMs === null) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextRaw = await fetchPowerBiEmbedConfig(requestParams);
        const next = safeEmbedConfig(nextRaw);
        if (!next) throw new Error("Power BI embed token refresh returned invalid config.");
        setEmbedConfig(next);
        await reportRef.current?.setAccessToken(next.accessToken);
      } catch (e) {
        const message = e?.message ? String(e.message) : "Failed to refresh Power BI token.";
        const url = e?.url ? ` (${String(e.url)})` : "";
        setError(`${message}${url}`);
      }
    }, refreshDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [tokenExpiry, configKey, requestParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
          aria-hidden="true"
        />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
        <div>{error}</div>
        <div className="mt-2 break-all text-[11px] text-red-600/80">
          API: {getPowerBiEmbedConfigUrl(requestParams)}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white"
      style={{ height, minHeight }}
    />
  );
};

export default PowerBIReportEmbed;
