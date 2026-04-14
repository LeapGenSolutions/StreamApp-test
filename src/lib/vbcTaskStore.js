const STORAGE_KEY = "seismic.vbc.taskOverrides.v1";

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export const getVbcTaskOverrides = () => {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("Unable to read VBC task overrides", error);
    return {};
  }
};

const writeVbcTaskOverrides = (nextValue) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
  } catch (error) {
    console.warn("Unable to persist VBC task overrides", error);
  }
};

export const setVbcTaskOverride = (taskKey, patch = {}) => {
  if (!taskKey) return;

  const current = getVbcTaskOverrides();
  const next = {
    ...current,
    [taskKey]: {
      ...(current[taskKey] || {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };

  writeVbcTaskOverrides(next);
};

export const clearVbcTaskOverride = (taskKey) => {
  if (!taskKey) return;

  const current = getVbcTaskOverrides();
  if (!current[taskKey]) return;

  const next = { ...current };
  delete next[taskKey];
  writeVbcTaskOverrides(next);
};
