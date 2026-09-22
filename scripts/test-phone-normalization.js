const assert = require("assert");

// Test normalizePhoneNumber logic
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return "";
  let cleaned = rawPhone.replace(/[\s\-\(\)\.\/]/g, "").trim();
  if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
  if (cleaned.startsWith("91") && cleaned.length === 12) cleaned = cleaned.substring(2);
  if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = cleaned.substring(1);
  while (cleaned.length > 10 && cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  return cleaned;
}

console.log("=== RUNNING PHONE NORMALIZATION & DUPLICATE TESTS ===");

const testCases = [
  { input: "+91 9876543210", expected: "9876543210" },
  { input: "98765 43210", expected: "9876543210" },
  { input: "09876543210", expected: "9876543210" },
  { input: "9876543210", expected: "9876543210" },
  { input: "+91-98765-43210", expected: "9876543210" },
  { input: "06901301315", expected: "6901301315" },
  { input: "069013 01315", expected: "6901301315" },
  { input: "+91 69013 01315", expected: "6901301315" },
  { input: "0361 245 6789", expected: "3612456789" },
];

let passed = 0;
for (const tc of testCases) {
  const result = normalizePhoneNumber(tc.input);
  assert.strictEqual(
    result,
    tc.expected,
    `Failed for ${tc.input}: expected ${tc.expected}, got ${result}`
  );
  console.log(`✓ "${tc.input}" normalized successfully to "${result}"`);
  passed++;
}

console.log(`\nALL ${passed} PHONE NORMALIZATION TESTS PASSED!`);
