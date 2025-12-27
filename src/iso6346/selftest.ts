/**
 * ISO 6346 Self-Test Suite
 * Runs validation tests and prints results to console.
 * Can be invoked in dev mode by importing and calling runIso6346Tests()
 */

import { computeCheckDigit, validateAndCorrectIso6346 } from "./iso6346";
import { loadAllowlist } from "./prefixAllowlist";

type TestCase = {
  name: string;
  input: string;
  expectValid: boolean;
  expectAccepted?: string;
  expectCorrected?: boolean;
};

const testCases: TestCase[] = [
  // Valid container numbers
  { name: "Valid MSCU (correct check digit)", input: "MSCU1234565", expectValid: true, expectAccepted: "MSCU1234565" },
  { name: "Valid TGHU (correct check digit)", input: "TGHU1234560", expectValid: true, expectAccepted: "TGHU1234560" },
  
  // Check digit computation tests
  { name: "Check digit computation - CSQU3054383", input: "CSQU3054383", expectValid: true, expectAccepted: "CSQU3054383" },
  
  // Regex failures (wrong 4th char)
  { name: "Invalid 4th char (A instead of U/J/Z/R)", input: "MSCA1234567", expectValid: false },
  
  // OCR correction cases: O→0
  { name: "OCR error O→0 in digits", input: "MSCU123456O", expectValid: false, expectCorrected: true },
  { name: "OCR error 0→O in prefix", input: "MSC0U234565", expectValid: false, expectCorrected: true },
  
  // OCR correction cases: I→1
  { name: "OCR error I→1 in digits", input: "MSCUI234565", expectValid: false, expectCorrected: true },
  { name: "OCR error 1→I in prefix", input: "1SCU1234565", expectValid: false },
  
  // Multiple OCR errors
  { name: "Multiple OCR errors (O and I)", input: "MSCU12345O1", expectValid: false },
  
  // Short/malformed inputs
  { name: "Too short", input: "MSCU12345", expectValid: false },
  { name: "Too long", input: "MSCU12345678", expectValid: false },
  { name: "Non-alphanumeric", input: "MSCU-123456", expectValid: false },
  
  // Allowlist filtering (these prefixes should be in fallback allowlist)
  { name: "Allowed prefix CMAU", input: "CMAU1234560", expectValid: true },
  { name: "Allowed prefix GESU", input: "GESU1234564", expectValid: true },
];

async function runTest(tc: TestCase): Promise<{ pass: boolean; details: string }> {
  try {
    const result = await validateAndCorrectIso6346(tc.input);
    
    const isAccepted = Boolean(result.accepted);
    const matchesExpected = isAccepted === tc.expectValid;
    const acceptedMatches = tc.expectAccepted === undefined || result.accepted === tc.expectAccepted;
    const correctedMatches = tc.expectCorrected === undefined || Boolean(result.corrected) === tc.expectCorrected;
    
    const pass = matchesExpected && acceptedMatches && correctedMatches;
    
    const details = [
      `input="${tc.input}"`,
      `regexOk=${result.regexOk}`,
      `checkOk=${result.checkOk}`,
      `accepted=${result.accepted ?? "null"}`,
      `corrected=${result.corrected?.value ?? "null"}`,
      `notes=${result.notes.join("; ")}`
    ].join(" | ");
    
    return { pass, details };
  } catch (err) {
    return { pass: false, details: `Error: ${err}` };
  }
}

function computeCheckDigitTests(): { pass: boolean; details: string }[] {
  const results: { pass: boolean; details: string }[] = [];
  
  // Known values
  const tests: [string, number | null][] = [
    ["MSCU123456", 5], // MSCU1234565
    ["TGHU123456", 0], // TGHU1234560
    ["CSQU305438", 3], // CSQU3054383
    ["ABCD", null],    // Too short
    ["MSCX123456", 5], // Should still compute (regex check is separate)
  ];
  
  for (const [code10, expected] of tests) {
    const result = computeCheckDigit(code10);
    const pass = result === expected;
    results.push({
      pass,
      details: `computeCheckDigit("${code10}") = ${result} (expected ${expected})`
    });
  }
  
  return results;
}

export async function runIso6346Tests(): Promise<void> {
  console.group("🧪 ISO 6346 Self-Test Suite");
  console.log("Running tests...\n");
  
  // Ensure allowlist is loaded
  const allowlist = await loadAllowlist();
  console.log(`Allowlist loaded: ${allowlist.size} prefixes`);
  console.log(`Prefixes: ${[...allowlist].join(", ")}\n`);
  
  let passed = 0;
  let failed = 0;
  
  // Check digit computation tests
  console.group("📐 Check Digit Computation Tests");
  for (const result of computeCheckDigitTests()) {
    if (result.pass) {
      console.log(`✅ ${result.details}`);
      passed++;
    } else {
      console.error(`❌ ${result.details}`);
      failed++;
    }
  }
  console.groupEnd();
  
  // Validation and correction tests
  console.group("🔍 Validation & Correction Tests");
  for (const tc of testCases) {
    const result = await runTest(tc);
    if (result.pass) {
      console.log(`✅ ${tc.name}`);
      console.log(`   ${result.details}`);
      passed++;
    } else {
      console.error(`❌ ${tc.name}`);
      console.error(`   ${result.details}`);
      failed++;
    }
  }
  console.groupEnd();
  
  console.log("\n" + "=".repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.warn("⚠️ Some tests failed.");
  }
  console.groupEnd();
}

// Auto-run in development
if (import.meta.env.DEV) {
  // Don't auto-run - let user trigger via console
  console.log("💡 Run ISO 6346 tests with: import('./iso6346/selftest').then(m => m.runIso6346Tests())");
}

export default runIso6346Tests;
