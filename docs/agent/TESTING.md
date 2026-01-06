# TESTING — How Tests Are Run

## Test Framework
- **Tool:** Playwright 1.57.0
- **Config:** `playwright.config.js`
- **Test directory:** `tests/e2e/`

## Running Tests

### Manual Execution
```bash
cd /root/pbk-crm-unified
npm run test                    # All tests
npx playwright test             # E2E tests
npx playwright test --headed    # With browser UI
npx playwright test --debug     # Debug mode
```

### Automated Script
```bash
./scripts/e2e.sh                # Run and save artifacts
```

## Test Files
- `crm.spec.js` — Core CRM functionality
- `crm-full-test.spec.js` — Complete system test
- `comprehensive-test.spec.js` — All modules
- `login-debug-test.spec.js` — Authentication

## Artifacts
- **Location:** `test-results/`, `playwright-report/`
- **Screenshots:** Saved on failure
- **Videos:** Recorded for failed tests
- **Logs:** Timestamped in `./artifacts/<timestamp>/`

## CI/CD Integration
- Tests run on every deployment
- Must pass before production deploy
- Saved to `/srv/AGENT_KB/test-reports/`

## Test Strategy
1. Ensure services are running
2. Run Playwright tests
3. Collect artifacts
4. Report results
5. Fix failures
6. Re-run until green

## Last updated
2026-01-05 by OpenCode agent setup
