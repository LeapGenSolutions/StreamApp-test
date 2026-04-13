const normalizeNameValue = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const splitFullName = (value = "") => {
  const normalizedValue = normalizeNameValue(value);
  if (!normalizedValue) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalizedValue.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const shouldPreferSplitLastName = (
  explicitFirstName = "",
  explicitLastName = "",
  splitFirstName = "",
  splitLastName = ""
) => {
  if (!explicitLastName || !splitLastName) {
    return false;
  }

  if (
    explicitFirstName &&
    splitFirstName &&
    explicitFirstName.toLowerCase() !== splitFirstName.toLowerCase()
  ) {
    return false;
  }

  const explicitLastLower = explicitLastName.toLowerCase();
  const splitLastLower = splitLastName.toLowerCase();

  return (
    explicitLastLower !== splitLastLower &&
    explicitLastLower.startsWith(`${splitLastLower} `)
  );
};

const stripDuplicatedLastName = (firstName = "", lastName = "") => {
  const normalizedFirstName = normalizeNameValue(firstName);
  const normalizedLastName = normalizeNameValue(lastName);

  if (!normalizedFirstName || !normalizedLastName) {
    return normalizedFirstName;
  }

  const firstNameLower = normalizedFirstName.toLowerCase();
  const lastNameLower = normalizedLastName.toLowerCase();
  const duplicateSuffix = ` ${lastNameLower}`;

  if (firstNameLower.endsWith(duplicateSuffix)) {
    return normalizedFirstName.slice(0, -duplicateSuffix.length).trim();
  }

  return normalizedFirstName;
};

export const resolveUserNameParts = (user = {}) => {
  const explicitFirstName = normalizeNameValue(
    user.firstName || user.given_name
  );
  const explicitLastName = normalizeNameValue(
    user.lastName || user.family_name
  );
  const fullNameCandidate = normalizeNameValue(
    user.fullName || user.name || user.doctor_name
  );
  const splitFromFullName = splitFullName(fullNameCandidate);

  const firstName =
    stripDuplicatedLastName(explicitFirstName, explicitLastName) ||
    splitFromFullName.firstName ||
    "";
  const lastName = shouldPreferSplitLastName(
    explicitFirstName,
    explicitLastName,
    splitFromFullName.firstName,
    splitFromFullName.lastName
  )
    ? splitFromFullName.lastName
    : explicitLastName || splitFromFullName.lastName || "";

  return {
    firstName,
    lastName,
    fullName:
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      fullNameCandidate,
  };
};
