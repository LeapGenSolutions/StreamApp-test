const normalizeText = (value = "") => String(value || "").trim();

const normalizeToken = (value = "") =>
  normalizeText(value).toLowerCase().replace(/[\s_-]/g, "");

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sortRowsByPriority = (rows = []) => {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return [...rows].sort((left, right) => {
    const rankDifference =
      (priorityRank[normalizeToken(left?.priority)] ?? 3) -
      (priorityRank[normalizeToken(right?.priority)] ?? 3);
    if (rankDifference !== 0) return rankDifference;
    return toNumber(right?.openGapCount) - toNumber(left?.openGapCount);
  });
};

const formatTopPatients = (rows = []) => {
  const rankedRows = sortRowsByPriority(rows).filter(
    (row) => normalizeText(row?.patientName) || toNumber(row?.openGapCount) > 0
  );

  if (rankedRows.length === 0) {
    return "No patient-level VBC priorities are visible in the current summary.";
  }

  return rankedRows
    .slice(0, 3)
    .map((row) => {
      const name = normalizeText(row?.patientName) || "Unknown patient";
      const gapCount = toNumber(row?.openGapCount);
      const priority = normalizeText(row?.priority || "low").toLowerCase();
      const badges = Array.isArray(row?.gapBadges) ? row.gapBadges.filter(Boolean).slice(0, 3) : [];
      const badgeText = badges.length > 0 ? ` (${badges.join(", ")})` : "";
      return `${name}: ${gapCount} open gaps, ${priority} priority${badgeText}`;
    })
    .join("; ");
};

const formatGapTrends = (rows = []) => {
  const counts = new Map();

  rows.forEach((row) => {
    const badges = Array.isArray(row?.gapBadges) ? row.gapBadges : [];
    badges.forEach((badge) => {
      const key = normalizeText(badge);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  const topGaps = Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  if (topGaps.length === 0) {
    return "No specific open-gap categories are visible in the current summary view.";
  }

  return topGaps.map(([badge, count]) => `${badge}: ${count}`).join("; ");
};

const buildSummaryResponse = ({ frontendContext = {}, question = "" }) => {
  const visibleKpis = frontendContext?.visibleKpis || {};
  const visibleRows = Array.isArray(frontendContext?.visibleRows)
    ? frontendContext.visibleRows
    : [];
  const prompt = normalizeToken(question);

  if (
    ["whichpatients", "needattention", "whofirst", "priority", "highestrisk"].some((token) =>
      prompt.includes(token)
    )
  ) {
    return `Using the visible VBC summary only: ${formatTopPatients(visibleRows)}.`;
  }

  if (
    ["opengap", "caregap", "gaptrend", "biggestgap", "whatgaps"].some((token) =>
      prompt.includes(token)
    )
  ) {
    return `Using the visible VBC summary only: ${formatGapTrends(visibleRows)}. Total open gaps: ${toNumber(
      visibleKpis.openGaps
    )}.`;
  }

  return `Using the visible VBC summary only: ${toNumber(
    visibleKpis.totalAppointments
  )} appointments, ${toNumber(visibleKpis.highRiskPatients)} high-risk patients, ${toNumber(
    visibleKpis.openGaps
  )} open gaps, and ${toNumber(visibleKpis.addressedGaps)} addressed gaps. Top priorities: ${formatTopPatients(
    visibleRows
  )}.`;
};

const getChecklistOpenGaps = (checklist = {}) =>
  Array.isArray(checklist?.open)
    ? checklist.open.filter((gap) => normalizeToken(gap?.status) !== "addressed")
    : [];

const getOpenGaps = (patientLifecycle = {}) =>
  Array.isArray(patientLifecycle?.gapsInCare)
    ? patientLifecycle.gapsInCare.filter((gap) => normalizeToken(gap?.status) === "open")
    : [];

const getActions = (patientLifecycle = {}) =>
  Array.isArray(patientLifecycle?.nextBestActions)
    ? patientLifecycle.nextBestActions.filter((action) => normalizeText(action?.action))
    : [];

const buildDetailsResponse = ({ frontendContext = {}, patientName = "", question = "" }) => {
  const patientLifecycle = frontendContext?.patientLifecycle || {};
  const checklist = frontendContext?.checklist || {};
  const name = normalizeText(patientName) || "this patient";
  const prompt = normalizeToken(question);
  const checklistOpenGaps = getChecklistOpenGaps(checklist);
  const openGaps = checklistOpenGaps.length > 0 ? checklistOpenGaps : getOpenGaps(patientLifecycle);
  const actions = getActions(patientLifecycle);
  const drivers = Array.isArray(patientLifecycle?.risk?.drivers)
    ? patientLifecycle.risk.drivers.filter(Boolean).slice(0, 3)
    : [];

  if (openGaps.length === 0 && actions.length === 0 && drivers.length === 0) {
    return `Using the visible details view only: there is no patient-level VBC lifecycle data available yet for ${name}.`;
  }

  if (["opengap", "caregap", "whatgap"].some((token) => prompt.includes(token))) {
    const gapSummary =
      openGaps.length > 0
        ? openGaps
            .slice(0, 5)
            .map((gap) => {
              const dueDate = normalizeText(gap?.dueDate).slice(0, 10);
              const label = normalizeText(
                gap?.measure || gap?.label || gap?.badge || gap?.gap || "Unknown gap"
              );
              return dueDate ? `${label} (due ${dueDate})` : label;
            })
            .join("; ")
        : "No open care gaps are visible in the current patient lifecycle view";
    return `Using the visible details view only for ${name}: ${gapSummary}.`;
  }

  if (["nextaction", "followup", "whatshould", "whatdo"].some((token) => prompt.includes(token))) {
    const actionSummary =
      actions.length > 0
        ? actions
            .slice(0, 4)
            .map((action) => {
              const owner = normalizeText(action?.owner);
              return owner ? `${action.action} (${owner})` : action.action;
            })
            .join("; ")
        : "No next-best actions are visible";
    return `Using the visible details view only for ${name}: ${actionSummary}.`;
  }

  const riskTier = normalizeText(patientLifecycle?.risk?.tier || "LOW");
  const rationale = normalizeText(patientLifecycle?.clinicalRationale);
  const driverSummary = drivers.length > 0 ? drivers.join("; ") : "No explicit risk drivers returned";

  return `Using the visible details view only for ${name}: ${riskTier} risk with ${openGaps.length} open gaps. Key drivers: ${driverSummary}. ${
    rationale || "No additional clinical rationale is visible."
  }`;
};

export const buildLocalVbcAssistantResponse = ({
  screen,
  question,
  patientName,
  frontendContext,
}) => {
  if (normalizeToken(screen) === "details") {
    return buildDetailsResponse({ frontendContext, patientName, question });
  }

  return buildSummaryResponse({ frontendContext, question });
};
