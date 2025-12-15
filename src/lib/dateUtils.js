export const formatUsDate = (raw) => {
  if (!raw) return "—";

  // Handle ISO or yyyy-mm-dd
  const dateOnly = String(raw).split("T")[0]; // yyyy-mm-dd
  const [yyyy, mm, dd] = dateOnly.split("-");

  if (!yyyy || !mm || !dd) return "—";

  return `${mm}/${dd}/${yyyy}`; // MM/DD/YYYY
};