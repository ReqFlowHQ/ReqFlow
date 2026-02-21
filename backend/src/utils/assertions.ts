import type {
  AssertionEntity,
  RunAssertionResultEntity,
  StoredResponse,
} from "../data/entities";

const getPathValue = (value: unknown, path: string): unknown => {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, value);
};

export const evaluateAssertion = (
  assertion: AssertionEntity,
  response: StoredResponse
): RunAssertionResultEntity => {
  const rule = assertion.rule || {};
  const ruleType = String((rule as Record<string, unknown>).type || "statusEquals");

  if (ruleType === "statusEquals") {
    const expected = Number((rule as Record<string, unknown>).expected || 200);
    const passed = response.status === expected;
    return {
      assertionId: assertion._id,
      name: assertion.name,
      passed,
      message: passed
        ? `Expected status ${expected}`
        : `Expected status ${expected}, got ${response.status}`,
    };
  }

  if (ruleType === "headerExists") {
    const key = String((rule as Record<string, unknown>).key || "").toLowerCase();
    const normalizedHeaders = Object.entries(response.headers || {}).reduce<
      Record<string, unknown>
    >((acc, [headerKey, headerValue]) => {
      acc[headerKey.toLowerCase()] = headerValue;
      return acc;
    }, {});
    const passed = key.length > 0 && normalizedHeaders[key] !== undefined;
    return {
      assertionId: assertion._id,
      name: assertion.name,
      passed,
      message: passed
        ? `Header ${key} exists`
        : `Header ${key || "(missing key)"} does not exist`,
    };
  }

  if (ruleType === "bodyPathEquals") {
    const path = String((rule as Record<string, unknown>).path || "");
    const expected = (rule as Record<string, unknown>).expected;
    const actual = getPathValue(response.data, path);
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    return {
      assertionId: assertion._id,
      name: assertion.name,
      passed,
      message: passed ? `Path ${path} matched` : `Path ${path} mismatch`,
    };
  }

  return {
    assertionId: assertion._id,
    name: assertion.name,
    passed: true,
    message: `Unsupported rule type ${ruleType} (ignored)`,
  };
};
