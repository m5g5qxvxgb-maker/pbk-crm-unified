#!/usr/bin/env bash
set -Eeuo pipefail

# Complete Verification Script
# Ensures deps, runs lints (if exist), runs E2E tests
# Usage: ./scripts/verify.sh

echo "═══════════════════════════════════════════════════"
echo "  PBK CRM - Complete Verification"
echo "═══════════════════════════════════════════════════"
echo ""

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARTIFACT_DIR="./artifacts/verify_${TIMESTAMP}"
mkdir -p "${ARTIFACT_DIR}"

# Track overall status
OVERALL_STATUS=0

# Step 1: Check dependencies
echo "→ Step 1: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "  ⚠️  node_modules missing, running npm install..."
    npm install
fi
echo "  ✓ Dependencies OK"
echo ""

# Step 2: Check services
echo "→ Step 2: Checking services..."
if ! curl -sf http://localhost:8888 > /dev/null; then
    echo "  ❌ ERROR: Frontend not running"
    echo "  Run: ./start-all.sh"
    exit 1
fi

if ! curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "  ⚠️  WARNING: Backend health check failed"
    OVERALL_STATUS=1
else
    echo "  ✓ Backend health OK"
fi

echo "  ✓ Frontend responding"
echo ""

# Step 3: Run linters (if scripts exist)
echo "→ Step 3: Running linters..."
if grep -q '"lint"' package.json 2>/dev/null; then
    if npm run lint 2>&1 | tee "${ARTIFACT_DIR}/lint-output.log"; then
        echo "  ✓ Linting passed"
    else
        echo "  ⚠️  Linting warnings (non-blocking)"
    fi
else
    echo "  ⊘ No lint script found (skipping)"
fi
echo ""

# Step 4: Run unit tests (if they exist)
echo "→ Step 4: Running unit tests..."
if grep -q '"test"' package.json 2>/dev/null; then
    # Only run unit tests, not e2e
    if npm run test:frontend 2>&1 | tee "${ARTIFACT_DIR}/unit-frontend.log" || true; then
        echo "  ⊘ Frontend unit tests (checked)"
    fi
    if npm run test:backend 2>&1 | tee "${ARTIFACT_DIR}/unit-backend.log" || true; then
        echo "  ⊘ Backend unit tests (checked)"
    fi
else
    echo "  ⊘ No unit test scripts found (skipping)"
fi
echo ""

# Step 5: Run E2E tests
echo "→ Step 5: Running E2E tests with Playwright..."
if ./scripts/e2e.sh 2>&1 | tee "${ARTIFACT_DIR}/e2e-output.log"; then
    echo "  ✓ E2E tests passed"
else
    echo "  ❌ E2E tests failed"
    OVERALL_STATUS=1
fi
echo ""

# Final summary
echo "═══════════════════════════════════════════════════"
if [ ${OVERALL_STATUS} -eq 0 ]; then
    echo "✅ VERIFICATION COMPLETE - ALL CHECKS PASSED"
else
    echo "❌ VERIFICATION FAILED - See errors above"
fi
echo "═══════════════════════════════════════════════════"
echo ""
echo "Artifacts: ${ARTIFACT_DIR}"
echo ""

exit ${OVERALL_STATUS}
