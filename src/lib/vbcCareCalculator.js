const STATIN_KEYWORDS = [
  "atorvastatin",
  "rosuvastatin",
  "simvastatin",
  "pravastatin",
  "lovastatin",
  "fluvastatin",
  "pitavastatin",
];

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const normalizeText = (value = "") => String(value || "").trim();

const toNumber = (value, fallback = NaN) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toIsoDate = (value) => {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const daysBetween = (left, right) => {
  const leftDate = toDate(left);
  const rightDate = toDate(right);
  if (!leftDate || !rightDate) return null;
  const delta = rightDate.getTime() - leftDate.getTime();
  return Math.floor(delta / 86400000);
};

const isOlderThanMonths = (value, months, today) => {
  const ageInDays = daysBetween(value, today);
  if (ageInDays === null) return true;
  return ageInDays > months * 30;
};

const addDays = (value, days) => {
  const date = toDate(value);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

const getAge = (dob, today) => {
  const dobDate = toDate(dob);
  const todayDate = toDate(today);
  if (!dobDate || !todayDate) return null;

  let age = todayDate.getFullYear() - dobDate.getFullYear();
  const monthDelta = todayDate.getMonth() - dobDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && todayDate.getDate() < dobDate.getDate())) {
    age -= 1;
  }
  return age;
};

const sortByNewestDate = (items, getDate) =>
  [...items].sort((left, right) => {
    const leftDate = toDate(getDate(left))?.getTime() || 0;
    const rightDate = toDate(getDate(right))?.getTime() || 0;
    return rightDate - leftDate;
  });

const latestByDate = (items, getDate) => sortByNewestDate(items, getDate)[0] || null;

const termMatches = (value, keywords = []) => {
  const token = normalizeToken(value);
  if (!token) return false;
  return keywords.some((keyword) => token.includes(normalizeToken(keyword)));
};

const codeStartsWith = (value, prefixes = []) => {
  const raw = normalizeToken(value).toUpperCase();
  if (!raw) return false;
  return prefixes.some((prefix) => raw.startsWith(prefix.toUpperCase()));
};

const getPatientId = (patient = {}) =>
  normalizeText(
    pickFirst(
      patient.patientID,
      patient.patientId,
      patient.details?.patientID,
      patient.details?.patientId,
      patient.id
    )
  );

const getPracticeId = (patient = {}) =>
  normalizeText(
    pickFirst(
      patient.practiceID,
      patient.practiceId,
      patient.details?.practiceID,
      patient.details?.practiceId
    )
  );

const getPatientDob = (patient = {}) =>
  pickFirst(
    patient.details?.dob,
    patient.details?.date_of_birth,
    patient.details?.birthDate,
    patient.details?.birth_date,
    patient.medicalHistory?.dob
  );

const isProblemActive = (problem = {}) => {
  const status = normalizeToken(
    pickFirst(problem.status, problem.problemStatus, problem.problem_status, "active")
  );
  return !["inactive", "resolved", "closed", "deleted"].includes(status);
};

const getActiveProblems = (patient = {}) =>
  toArray(patient.problems).filter((problem) => isProblemActive(problem));

const getProblemText = (problem = {}) =>
  [
    pickFirst(problem.name, problem.problem, problem.description, problem.display),
    pickFirst(problem.icd10, problem.icd10Code, problem.code),
  ]
    .filter(hasValue)
    .join(" ");

const mapProblemsToConditionFlags = (problems = []) => {
  const flags = {
    diabetes: false,
    hypertension: false,
    hyperlipidemia: false,
    ckd: false,
    cad: false,
    heartFailure: false,
    copd: false,
    depression: false,
  };

  problems.forEach((problem) => {
    const text = getProblemText(problem);
    const code = pickFirst(problem.icd10, problem.icd10Code, problem.code, "");

    if (
      termMatches(text, ["diabetes", "t1dm", "t2dm", "dm"]) ||
      codeStartsWith(code, ["E10", "E11", "E13"])
    ) {
      flags.diabetes = true;
    }
    if (termMatches(text, ["hypertension", "htn"]) || codeStartsWith(code, ["I10", "I11", "I12", "I13", "I15"])) {
      flags.hypertension = true;
    }
    if (
      termMatches(text, ["hyperlipidemia", "dyslipidemia", "cholesterol"]) ||
      codeStartsWith(code, ["E78"])
    ) {
      flags.hyperlipidemia = true;
    }
    if (termMatches(text, ["chronic kidney", "ckd"]) || codeStartsWith(code, ["N18"])) {
      flags.ckd = true;
    }
    if (
      termMatches(text, ["coronary artery", "ischemic heart", "cad"]) ||
      codeStartsWith(code, ["I20", "I21", "I22", "I23", "I24", "I25"])
    ) {
      flags.cad = true;
    }
    if (termMatches(text, ["heart failure", "chf"]) || codeStartsWith(code, ["I50"])) {
      flags.heartFailure = true;
    }
    if (termMatches(text, ["copd", "emphysema", "chronic bronchitis"]) || codeStartsWith(code, ["J44"])) {
      flags.copd = true;
    }
    if (
      termMatches(text, ["depression", "depressive disorder"]) ||
      codeStartsWith(code, ["F32", "F33"])
    ) {
      flags.depression = true;
    }
  });

  return flags;
};

const countTrueConditions = (conditions = {}) =>
  Object.values(conditions).filter(Boolean).length;

const getLabDate = (lab = {}) =>
  pickFirst(lab.date, lab.resultDate, lab.collectedDate, lab.observedAt, lab.performedDate);

const getLabValue = (lab = {}) =>
  pickFirst(lab.value, lab.resultValue, lab.numericValue, lab.result);

const getLabCode = (lab = {}) =>
  normalizeText(pickFirst(lab.loinc, lab.loincCode, lab.code, lab.testCode));

const getLabName = (lab = {}) =>
  normalizeText(pickFirst(lab.name, lab.testName, lab.description, lab.label));

const findLatestLab = (labs = [], config = {}) => {
  const { loincCodes = [], nameTerms = [] } = config;

  const matches = labs.filter((lab) => {
    const code = getLabCode(lab);
    const name = getLabName(lab);
    const codeMatch = loincCodes.some((loinc) => normalizeToken(code) === normalizeToken(loinc));
    const nameMatch = nameTerms.some((term) => termMatches(name, [term]));
    return codeMatch || nameMatch;
  });

  const latest = latestByDate(matches, getLabDate);
  if (!latest) return null;

  return {
    value: toNumber(getLabValue(latest)),
    rawValue: getLabValue(latest),
    unit: normalizeText(pickFirst(latest.unit, latest.units)),
    date: toIsoDate(getLabDate(latest)),
    source: latest,
  };
};

const getVitalDate = (vital = {}) =>
  pickFirst(vital.date, vital.takenAt, vital.recordedAt, vital.observedAt);

const getLatestBloodPressure = (vitals = []) => {
  const candidates = vitals
    .map((vital) => {
      const systolic = toNumber(
        pickFirst(vital.systolic, vital.sys, vital.bloodPressureSystolic, vital.bpSystolic)
      );
      const diastolic = toNumber(
        pickFirst(vital.diastolic, vital.dia, vital.bloodPressureDiastolic, vital.bpDiastolic)
      );

      if (Number.isFinite(systolic) && Number.isFinite(diastolic)) {
        return {
          systolic,
          diastolic,
          date: toIsoDate(getVitalDate(vital)),
          source: vital,
        };
      }

      const rawBp = normalizeText(
        pickFirst(vital.bloodPressure, vital.bp, vital.value, vital.result)
      );
      const match = rawBp.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
      if (!match) return null;

      return {
        systolic: toNumber(match[1]),
        diastolic: toNumber(match[2]),
        date: toIsoDate(getVitalDate(vital)),
        source: vital,
      };
    })
    .filter(Boolean);

  return latestByDate(candidates, (item) => item.date);
};

const getQuestionnaireDate = (item = {}) =>
  pickFirst(item.date, item.completedAt, item.recordedAt, item.administeredAt);

const getLatestPhq9 = (screeners = []) => {
  const matches = screeners.filter((item) =>
    termMatches(
      pickFirst(item.name, item.questionnaire, item.questionnaireName, item.title),
      ["phq9", "phq-9"]
    )
  );

  const latest = latestByDate(matches, getQuestionnaireDate);
  if (!latest) return null;

  return {
    score: toNumber(pickFirst(latest.score, latest.totalScore, latest.value)),
    date: toIsoDate(getQuestionnaireDate(latest)),
    source: latest,
  };
};

const getEncounterDate = (encounter = {}) =>
  pickFirst(encounter.date, encounter.encounterDate, encounter.serviceDate, encounter.startDate);

const getLatestEncounter = (encounters = []) => {
  const latest = latestByDate(encounters, getEncounterDate);
  if (!latest) return null;
  return {
    date: toIsoDate(getEncounterDate(latest)),
    source: latest,
  };
};

const getMedicationName = (medication = {}) =>
  normalizeText(pickFirst(medication.name, medication.medication, medication.display));

const isMedicationActive = (medication = {}, today) => {
  const status = normalizeToken(pickFirst(medication.status, medication.medicationStatus, "active"));
  if (["inactive", "discontinued", "stopped", "ended"].includes(status)) return false;

  const endDate = pickFirst(medication.endDate, medication.stopDate, medication.endedAt);
  if (endDate && daysBetween(endDate, today) > 0) return false;
  return true;
};

const getActiveMedications = (patient = {}, today) =>
  toArray(patient.medications).filter((medication) => isMedicationActive(medication, today));

const hasActiveStatin = (medications = []) =>
  medications.some((medication) =>
    STATIN_KEYWORDS.some((keyword) => termMatches(getMedicationName(medication), [keyword]))
  );

const hasBehavioralHealthFollowUp = (patient = {}, phqDate, today) => {
  const phq = toDate(phqDate);
  if (!phq) return false;

  const followUpEncounters = toArray(patient.encounters).filter((encounter) => {
    const encounterDate = toDate(getEncounterDate(encounter));
    if (!encounterDate || encounterDate < phq) return false;

    const days = daysBetween(phq, encounterDate);
    if (days === null || days > 60) return false;

    const text = [
      pickFirst(encounter.type, encounter.encounterType, encounter.reason, encounter.description),
      pickFirst(encounter.assessment, encounter.notes),
    ]
      .filter(hasValue)
      .join(" ");

    return termMatches(text, ["depression", "behavioral", "mental health", "phq"]);
  });

  if (followUpEncounters.length > 0) return true;

  const followUpScreeners = toArray(patient.administeredquestionnairescreeners).filter((item) => {
    const itemDate = toDate(getQuestionnaireDate(item));
    if (!itemDate || itemDate < phq) return false;
    const days = daysBetween(phq, itemDate);
    if (days === null || days > 60) return false;

    return Boolean(
      item.followUpDocumented ||
        item.follow_up_documented ||
        item.followUp ||
        termMatches(pickFirst(item.notes, item.result, item.outcome), [
          "follow up",
          "behavioral",
          "counseling",
        ])
    );
  });

  return followUpScreeners.length > 0;
};

const buildFactSet = (patient = {}, today) => {
  const labs = toArray(patient.labResults);
  const vitals = toArray(patient.vitals);
  const activeProblems = getActiveProblems(patient);
  const activeConditions = mapProblemsToConditionFlags(activeProblems);

  return {
    patientID: getPatientId(patient),
    practiceID: getPracticeId(patient),
    age: getAge(getPatientDob(patient), today),
    activeProblems,
    activeConditions,
    latestA1c: findLatestLab(labs, {
      loincCodes: ["4548-4", "17856-6"],
      nameTerms: ["a1c", "hba1c", "hemoglobin a1c"],
    }),
    latestLDL: findLatestLab(labs, {
      loincCodes: ["13457-7", "18262-6"],
      nameTerms: ["ldl", "ldl cholesterol"],
    }),
    latestCreatinine: findLatestLab(labs, {
      loincCodes: ["2160-0"],
      nameTerms: ["creatinine"],
    }),
    latestBP: getLatestBloodPressure(vitals),
    latestPHQ9: getLatestPhq9(toArray(patient.administeredquestionnairescreeners)),
    lastEncounter: getLatestEncounter(toArray(patient.encounters)),
    activeMedications: getActiveMedications(patient, today),
  };
};

const buildGap = (measure, status, evidence, dueDate = null) => ({
  measure,
  status,
  evidence,
  dueDate,
});

const buildMeasure = (name, status) => ({ name, status });

const evaluateMeasuresAndGaps = (patient, facts, today) => {
  const gapsInCare = [];
  const qualityMeasures = [];
  const todayIso = toIsoDate(today);

  if (facts.activeConditions.diabetes) {
    if (!facts.latestA1c) {
      qualityMeasures.push(buildMeasure("Diabetes A1c Control", "NOT_EVALUABLE"));
      gapsInCare.push(
        buildGap(
          "Diabetes A1c Monitoring",
          "OPEN",
          "Diabetes present but no A1c result was found",
          todayIso
        )
      );
    } else if (isOlderThanMonths(facts.latestA1c.date, 12, today)) {
      qualityMeasures.push(buildMeasure("Diabetes A1c Control", "NOT_EVALUABLE"));
      gapsInCare.push(
        buildGap(
          "Diabetes A1c Monitoring",
          "OPEN",
          `Latest A1c on ${facts.latestA1c.date} is older than 12 months`,
          todayIso
        )
      );
    } else if (facts.latestA1c.value > 8.0) {
      qualityMeasures.push(buildMeasure("Diabetes A1c Control", "NOT_MET"));
      gapsInCare.push(
        buildGap(
          "Diabetes A1c Control",
          "OPEN",
          `Latest A1c ${facts.latestA1c.rawValue} on ${facts.latestA1c.date}`,
          addDays(today, 30)
        )
      );
    } else {
      qualityMeasures.push(buildMeasure("Diabetes A1c Control", "MET"));
      gapsInCare.push(
        buildGap(
          "Diabetes A1c Control",
          "CLOSED",
          `Latest A1c ${facts.latestA1c.rawValue} on ${facts.latestA1c.date}`,
          null
        )
      );
    }
  } else {
    qualityMeasures.push(buildMeasure("Diabetes A1c Control", "NOT_EVALUABLE"));
  }

  if (facts.activeConditions.hypertension) {
    if (!facts.latestBP) {
      qualityMeasures.push(buildMeasure("Blood Pressure Control", "NOT_EVALUABLE"));
      gapsInCare.push(
        buildGap(
          "Blood Pressure Monitoring",
          "OPEN",
          "Hypertension present but no blood pressure reading was found",
          todayIso
        )
      );
    } else if (facts.latestBP.systolic >= 140 || facts.latestBP.diastolic >= 90) {
      qualityMeasures.push(buildMeasure("Blood Pressure Control", "NOT_MET"));
      gapsInCare.push(
        buildGap(
          "Blood Pressure Control",
          "OPEN",
          `Latest BP ${facts.latestBP.systolic}/${facts.latestBP.diastolic} on ${facts.latestBP.date}`,
          addDays(today, 30)
        )
      );
    } else {
      qualityMeasures.push(buildMeasure("Blood Pressure Control", "MET"));
      gapsInCare.push(
        buildGap(
          "Blood Pressure Control",
          "CLOSED",
          `Latest BP ${facts.latestBP.systolic}/${facts.latestBP.diastolic} on ${facts.latestBP.date}`,
          null
        )
      );
    }
  } else {
    qualityMeasures.push(buildMeasure("Blood Pressure Control", "NOT_EVALUABLE"));
  }

  const statinIndicated =
    facts.activeConditions.diabetes ||
    facts.activeConditions.hyperlipidemia ||
    facts.activeConditions.cad;

  if (statinIndicated) {
    if (hasActiveStatin(facts.activeMedications)) {
      qualityMeasures.push(buildMeasure("Statin Therapy Alignment", "MET"));
      gapsInCare.push(
        buildGap(
          "Statin Therapy Alignment",
          "CLOSED",
          "Active statin medication found",
          null
        )
      );
    } else {
      qualityMeasures.push(buildMeasure("Statin Therapy Alignment", "NOT_MET"));
      gapsInCare.push(
        buildGap(
          "Statin Therapy Alignment",
          "OPEN",
          "Statin-indicated condition present without active statin medication",
          addDays(today, 30)
        )
      );
    }
  } else {
    qualityMeasures.push(buildMeasure("Statin Therapy Alignment", "NOT_EVALUABLE"));
  }

  if (!facts.latestPHQ9) {
    qualityMeasures.push(buildMeasure("Depression Screening", "NOT_EVALUABLE"));
    gapsInCare.push(
      buildGap(
        "Depression Screening",
        "OPEN",
        "No PHQ-9 screening was found",
        todayIso
      )
    );
  } else if (isOlderThanMonths(facts.latestPHQ9.date, 12, today)) {
    qualityMeasures.push(buildMeasure("Depression Screening", "NOT_EVALUABLE"));
    gapsInCare.push(
      buildGap(
        "Depression Screening",
        "OPEN",
        `Latest PHQ-9 on ${facts.latestPHQ9.date} is older than 12 months`,
        todayIso
      )
    );
  } else if (
    facts.latestPHQ9.score >= 10 &&
    !hasBehavioralHealthFollowUp(patient, facts.latestPHQ9.date, today)
  ) {
    qualityMeasures.push(buildMeasure("Depression Screening", "NOT_MET"));
    gapsInCare.push(
      buildGap(
        "Depression Screening Follow-up",
        "OPEN",
        `PHQ-9 score ${facts.latestPHQ9.score} on ${facts.latestPHQ9.date} without documented follow-up`,
        addDays(facts.latestPHQ9.date, 30)
      )
    );
  } else {
    qualityMeasures.push(buildMeasure("Depression Screening", "MET"));
    gapsInCare.push(
      buildGap(
        "Depression Screening",
        "CLOSED",
        `PHQ-9 score ${facts.latestPHQ9.score} on ${facts.latestPHQ9.date}`,
        null
      )
    );
  }

  const hasChronicCondition = countTrueConditions(facts.activeConditions) > 0;
  const encounterHistoryPresent = Array.isArray(patient.encounters);

  if (!hasChronicCondition) {
    qualityMeasures.push(buildMeasure("Visit Frequency / Continuity", "NOT_EVALUABLE"));
  } else if (!facts.lastEncounter && !encounterHistoryPresent) {
    qualityMeasures.push(buildMeasure("Visit Frequency / Continuity", "NOT_EVALUABLE"));
  } else if (!facts.lastEncounter || isOlderThanMonths(facts.lastEncounter.date, 12, today)) {
    qualityMeasures.push(buildMeasure("Visit Frequency / Continuity", "NOT_MET"));
    gapsInCare.push(
      buildGap(
        "Visit Frequency / Continuity",
        "OPEN",
        "Active chronic condition present without a visit in the last 12 months",
        todayIso
      )
    );
  } else {
    qualityMeasures.push(buildMeasure("Visit Frequency / Continuity", "MET"));
    gapsInCare.push(
      buildGap(
        "Visit Frequency / Continuity",
        "CLOSED",
        `Last encounter on ${facts.lastEncounter.date}`,
        null
      )
    );
  }

  return { gapsInCare, qualityMeasures };
};

const computeRisk = (facts, evaluation, today) => {
  let score = 0;
  const drivers = [];

  if (facts.age !== null && facts.age >= 65) {
    score += 2;
    drivers.push(`Age ${facts.age}`);
  }

  const chronicCount = countTrueConditions(facts.activeConditions);
  if (chronicCount > 0) {
    score += Math.min(chronicCount, 4);
    drivers.push(`${chronicCount} active chronic conditions`);
  }

  if (facts.latestA1c && Number.isFinite(facts.latestA1c.value)) {
    if (facts.latestA1c.value > 9) {
      score += 3;
      drivers.push(`A1c ${facts.latestA1c.rawValue}`);
    } else if (facts.latestA1c.value > 8) {
      score += 2;
      drivers.push(`A1c ${facts.latestA1c.rawValue}`);
    }
  }

  if (facts.latestLDL && Number.isFinite(facts.latestLDL.value)) {
    if (facts.latestLDL.value >= 190) {
      score += 2;
      drivers.push(`LDL ${facts.latestLDL.rawValue}`);
    } else if (facts.latestLDL.value >= 130) {
      score += 1;
      drivers.push(`LDL ${facts.latestLDL.rawValue}`);
    }
  }

  if (facts.latestCreatinine && Number.isFinite(facts.latestCreatinine.value)) {
    if (facts.latestCreatinine.value > 1.5) {
      score += 2;
      drivers.push(`Creatinine ${facts.latestCreatinine.rawValue}`);
    } else if (facts.latestCreatinine.value > 1.3) {
      score += 1;
      drivers.push(`Creatinine ${facts.latestCreatinine.rawValue}`);
    }
  }

  if (facts.latestBP && (facts.latestBP.systolic >= 140 || facts.latestBP.diastolic >= 90)) {
    score += 2;
    drivers.push(`BP ${facts.latestBP.systolic}/${facts.latestBP.diastolic}`);
  }

  if (facts.latestPHQ9 && Number.isFinite(facts.latestPHQ9.score)) {
    if (facts.latestPHQ9.score >= 15) {
      score += 3;
      drivers.push(`PHQ-9 ${facts.latestPHQ9.score}`);
    } else if (facts.latestPHQ9.score >= 10) {
      score += 2;
      drivers.push(`PHQ-9 ${facts.latestPHQ9.score}`);
    }
  }

  if (!facts.lastEncounter || isOlderThanMonths(facts.lastEncounter.date, 12, today)) {
    score += 2;
    drivers.push("No encounter in last 12 months");
  }

  const openGapCount = evaluation.gapsInCare.filter((gap) => gap.status === "OPEN").length;
  if (openGapCount >= 4) {
    score += 2;
    drivers.push(`${openGapCount} open care gaps`);
  } else if (openGapCount >= 2) {
    score += 1;
    drivers.push(`${openGapCount} open care gaps`);
  }

  let tier = "LOW";
  if (score >= 8) tier = "HIGH";
  else if (score >= 4) tier = "MEDIUM";

  return { tier, score, drivers };
};

const dedupeActions = (actions = []) => {
  const seen = new Set();
  return actions.filter((action) => {
    const key = normalizeToken(`${action.action}|${action.reason}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildNextBestActions = (evaluation, risk) => {
  const actions = [];

  evaluation.gapsInCare
    .filter((gap) => gap.status === "OPEN")
    .forEach((gap) => {
      const measure = normalizeToken(gap.measure);

      if (measure.includes("a1c")) {
        actions.push({
          action: "Order HbA1c and schedule diabetes follow-up",
          priority: risk.tier === "HIGH" ? "HIGH" : "MEDIUM",
          reason: gap.evidence,
        });
        return;
      }

      if (measure.includes("bloodpressure")) {
        actions.push({
          action: "Repeat blood pressure and review antihypertensive regimen",
          priority: "HIGH",
          reason: gap.evidence,
        });
        return;
      }

      if (measure.includes("statin")) {
        actions.push({
          action: "Review statin therapy eligibility and start if appropriate",
          priority: "MEDIUM",
          reason: gap.evidence,
        });
        return;
      }

      if (measure.includes("depression")) {
        actions.push({
          action: "Arrange behavioral health follow-up and document care plan",
          priority: "HIGH",
          reason: gap.evidence,
        });
        return;
      }

      if (measure.includes("visitfrequency") || measure.includes("continuity")) {
        actions.push({
          action: "Schedule chronic care follow-up visit",
          priority: risk.tier === "HIGH" ? "HIGH" : "MEDIUM",
          reason: gap.evidence,
        });
      }
    });

  if (risk.tier === "HIGH") {
    actions.unshift({
      action: "Care manager outreach within 7 days",
      priority: "HIGH",
      reason: risk.drivers.slice(0, 3).join(", "),
    });
  }

  return dedupeActions(actions).slice(0, 5);
};

const buildClinicalRationale = (evaluation, risk) => {
  const openGapCount = evaluation.gapsInCare.filter((gap) => gap.status === "OPEN").length;
  const drivers = risk.drivers.slice(0, 3).join(", ") || "limited structured data";
  return `${risk.tier} risk patient with ${openGapCount} open care gaps. Key drivers: ${drivers}.`;
};

export const isVbcPatientRecord = (value = {}) =>
  Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      hasValue(getPatientId(value)) &&
      hasValue(getPracticeId(value)) &&
      ["details", "vitals", "problems", "medications", "labResults", "encounters"].some(
        (field) => field in value
      )
  );

export const calculateVbcPatientOutput = (patient = {}, { today = new Date() } = {}) => {
  const facts = buildFactSet(patient, today);
  const evaluation = evaluateMeasuresAndGaps(patient, facts, today);
  const risk = computeRisk(facts, evaluation, today);
  const nextBestActions = buildNextBestActions(evaluation, risk);
  const clinicalRationale = buildClinicalRationale(evaluation, risk);

  return {
    patientID: facts.patientID,
    practiceID: facts.practiceID,
    risk,
    gapsInCare: evaluation.gapsInCare,
    qualityMeasures: evaluation.qualityMeasures,
    nextBestActions,
    clinicalRationale,
  };
};
