#!/usr/bin/env bash
set -Eeuo pipefail

# E2E Test Runner with Artifact Collection
# Usage: ./scripts/e2e.sh [test-file]

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARTIFACT_DIR="./artifacts/${TIMESTAMP}"
TEST_FILE="${1:-}"

echo "═══════════════════════════════════════════════════"
echo "  PBK CRM - E2E Test Runner"
echo "═══════════════════════════════════════════════════"
echo "Timestamp: ${TIMESTAMP}"
echo "Artifact dir: ${ARTIFACT_DIR}"
echo ""

# Create artifact directory
mkdir -p "${ARTIFACT_DIR}"

# Check if services are running
echo "→ Checking services..."
if ! curl -sf http://localhost:8888 > /dev/null; then
    echo "❌ ERROR: Frontend (port 8888) not responding"
    exit 1
fi

if ! curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  WARNING: Backend (port 3000) might not be running"
fi

echo "✓ Services responding"
echo ""

# Run Playwright tests
echo "→ Running Playwright tests..."
if [ -n "${TEST_FILE}" ]; then
    echo "  Test file: ${TEST_FILE}"
    npx playwright test "${TEST_FILE}" --reporter=html,json 2>&1 | tee "${ARTIFACT_DIR}/test-output.log"
    TEST_EXIT_CODE=${PIPESTATUS[0]}
else
    echo "  Running all E2E tests..."
    npx playwright test --reporter=html,json 2>&1 | tee "${ARTIFACT_DIR}/test-output.log"
    TEST_EXIT_CODE=${PIPESTATUS[0]}
fi

echo ""

# Copy test results
echo "→ Collecting artifacts..."
if [ -d "test-results" ]; then
    cp -r test-results "${ARTIFACT_DIR}/" 2>/dev/null || true
    echo "  ✓ Test results copied"
fi

if [ -d "playwright-report" ]; then
    cp -r playwright-report "${ARTIFACT_DIR}/" 2>/dev/null || true
    echo "  ✓ HTML report copied"
fi

# Save system info
echo "→ Saving system info..."
{
    echo "=== System Info ==="
    date
    echo ""
    echo "Node: $(node --version)"
    echo "Playwright: $(npx playwright --version)"
    echo ""
    echo "=== Services ==="
    curl -sf http://localhost:8888 > /dev/null && echo "✓ Frontend: UP" || echo "✗ Frontend: DOWN"
    curl -sf http://localhost:3000/health > /dev/null 2>&1 && echo "✓ Backend: UP" || echo "✗ Backend: DOWN"
    echo ""
    echo "=== Test Exit Code ==="
    echo "${TEST_EXIT_CODE}"
} > "${ARTIFACT_DIR}/system-info.txt"

# Summary
echo ""
echo "═══════════════════════════════════════════════════"
if [ ${TEST_EXIT_CODE} -eq 0 ]; then
    echo "✅ ALL TESTS PASSED"
else
    echo "❌ TESTS FAILED (exit code: ${TEST_EXIT_CODE})"
fi
echo "═══════════════════════════════════════════════════"
echo ""
echo "Artifacts saved to: ${ARTIFACT_DIR}"
echo ""
echo "View HTML report:"
echo "  npx playwright show-report ${ARTIFACT_DIR}/playwright-report"
echo ""

exit ${TEST_EXIT_CODE}
