const parseSubjective = (subjectiveTextRaw = "") => {
  const rosIndex = subjectiveTextRaw.search(/\b(ROS|Review of Systems|System Review)\b\s*[:-]/i);
  let hpi = "";
  let ros = "";

  if (rosIndex !== -1) {
    hpi = subjectiveTextRaw.slice(0, rosIndex).trim();
    ros = subjectiveTextRaw
      .slice(rosIndex)
      .replace(/\b(ROS|Review of Systems|System Review)\b\s*[:-]/i, "")
      .trim();
  } else {
    hpi = subjectiveTextRaw.trim();
  }

  return { hpi, ros };
};

// --- ROS Formatter ---
const formatROS = (rosText) => {
  if (!rosText) return null;

  // Map synonyms to canonical system names
  const systemMap = {
    General: "Constitutional",
    Constitutional: "Constitutional",
    Cardiac: "Cardiovascular",
    Heart: "Cardiovascular",
    Neuro: "Neurological",
    Nervous: "Neurological",
  };

  const validSystems = [
    "Constitutional",
    "Eyes",
    "ENT",
    "Cardiovascular",
    "Respiratory",
    "Gastrointestinal",
    "Genitourinary",
    "Neurological",
    "Musculoskeletal",
    "Skin",
  ];

  const rosLines = rosText
    .split(/\n|(?:-\s+)/)
    .map((l) => l.trim())
    .filter((line) => line && /^[A-Za-z]/.test(line));

  return rosLines
    .map((line) => {
      const [heading, ...rest] = line.split(":");
      let system = heading?.trim().replace(/\.$/, "");
      let value = rest.join(":").trim().replace(/\.+$/, "");

      // normalize system name (map synonyms)
      system = systemMap[system] || system;

      if (!system || !validSystems.some((v) => v.toLowerCase() === system.toLowerCase())) {
        return null;
      }

      // handle "no"/"denies" anywhere, not just at start
      value = value
        .replace(/\bno\s+/gi, "Negative for ")
        .replace(/\bdenies\s+/gi, "Negative for ")
        .replace(/\s+and\s+/gi, ", ")
        .replace(/\bpositive for\s*/gi, "Positive for ")
        .replace(/\bpositive\s+/gi, "Positive for ")
        .replace(/\bnegative for\s*/gi, "Negative for ")
        .replace(/\bnegative\s+/gi, "Negative for ");

      // fallback: if not prefixed, assume positive
      if (!/^Negative for|^Positive for/i.test(value)) {
        value = `Positive for ${value}`;
      }

      return { system, value };
    })
    .filter(Boolean);
};

// --- Vitals Normalizer ---
const normalizeVitalLabel = (label) => {
  const map = {
    bp: "Blood Pressure",
    "blood pressure": "Blood Pressure",
    hr: "Heart Rate",
    "heart rate": "Heart Rate",
    pulse: "Pulse",
    temp: "Temperature",
    temperature: "Temperature",
    rr: "Respiratory Rate",
    "respiratory rate": "Respiratory Rate",
    "o2 sat": "Oxygen Saturation",
    "oxygen saturation": "Oxygen Saturation",
    spo2: "Oxygen Saturation",
    "pulse ox": "Oxygen Saturation",
    bmi: "BMI",
    wt: "Weight",
    weight: "Weight",
    ht: "Height",
    height: "Height",
  };
  return map[label.toLowerCase()] || label;
};

export { parseSubjective, formatROS, normalizeVitalLabel }