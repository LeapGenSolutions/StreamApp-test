const STORAGE_KEY = "seismic.vbc.checklistReviews.v1";

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const readAllReviews = () => {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("Unable to read VBC checklist reviews", error);
    return {};
  }
};

const writeAllReviews = (value) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn("Unable to persist VBC checklist reviews", error);
  }
};

export const getStoredVbcChecklistReviews = (appointmentId) => {
  if (!appointmentId) return {};

  const allReviews = readAllReviews();
  const appointmentReviews = allReviews[String(appointmentId)];
  return appointmentReviews && typeof appointmentReviews === "object"
    ? appointmentReviews
    : {};
};

export const writeStoredVbcChecklistReviews = (appointmentId, reviews = {}) => {
  if (!appointmentId) return;

  const allReviews = readAllReviews();
  const nextValue = { ...allReviews, [String(appointmentId)]: reviews };
  writeAllReviews(nextValue);
};

export const setStoredVbcChecklistReview = (
  appointmentId,
  checklistItemId,
  patch = {}
) => {
  if (!appointmentId || !checklistItemId) return;

  const currentReviews = getStoredVbcChecklistReviews(appointmentId);
  const normalizedItemId = String(checklistItemId);
  const nextValue = {
    ...currentReviews,
    [normalizedItemId]: {
      ...(currentReviews[normalizedItemId] || {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };

  writeStoredVbcChecklistReviews(appointmentId, nextValue);
};
