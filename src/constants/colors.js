export const bgColors = [
  "bg-red-600", "bg-green-600", "bg-blue-600",
  "bg-yellow-600", "bg-purple-600", "bg-pink-600",
  "bg-indigo-600", "bg-teal-600", "bg-amber-600"
];

export const APPOINTMENT_STATUS_COLORS = ["#22C55E", "#3B82F6", "#FACC15", "#EF4444"];

export const getColorFromName = (name = "") => {
  const cleaned = name.trim().toLowerCase();
  let hash = 0;

  for (let i = 0; i < cleaned.length; i++) {
    hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hueSteps = 12; // 12 distinct hues, 30 degrees apart
  const baseHue = Math.abs(hash) % hueSteps;
  const hue = baseHue * 30;

  // Choose from pre-set saturation/lightness values (avoid too light/gray)
  const satOptions = [65, 75];      // strong, saturated
  const lightOptions = [40, 50, 60]; // no light greys or white

  let sat = satOptions[Math.abs(hash) % satOptions.length];
  let light = lightOptions[Math.abs(hash >> 3) % lightOptions.length];

  // Edge case fallback: If resulting color is still too light/gray
  if (sat < 30 || light > 65) {
    sat = 70;
    light = 45;
  }

  return `hsl(${hue}, ${sat}%, ${light}%)`;
};
