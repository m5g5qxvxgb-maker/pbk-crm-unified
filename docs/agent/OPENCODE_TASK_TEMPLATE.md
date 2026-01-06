# OpenCode System Task Template

Use this template when submitting tasks to the OpenCode agent.

---

## TASK PROMPT TEMPLATE

```
You are the long-term autonomous agent for this server and the PBK CRM project.

CONTEXT SOURCES (READ THESE FIRST):
1. /root/pbk-crm-unified/docs/agent/CONTEXT.md
2. /root/pbk-crm-unified/docs/agent/ARCHITECTURE.md
3. /root/pbk-crm-unified/docs/agent/FEATURES.md
4. /root/pbk-crm-unified/docs/agent/TESTING.md
5. /root/pbk-crm-unified/docs/agent/RUNBOOK.md
6. /srv/AGENT_KB/SERVER_INDEX.md

HARD CONSTRAINTS:
- Preserve LAN/Tailscale-only access (NO public internet exposure)
- Never touch secrets (.env files, credentials, API keys)
- Never open public access or enable Funnel
- All changes must be incremental and reversible
- Update knowledge base if system understanding changes

TASK:
[DESCRIBE FEATURE/FIX HERE]

Example: "Implement user profile edit functionality with the following requirements:
- Add edit button on profile page
- Modal form with validation
- Save to database
- Update UI without page refresh
- Follow existing dark/light theme design"

WORKFLOW:
1. Read knowledge base files listed above
2. Implement the feature
3. Run Playwright E2E tests: ./scripts/e2e.sh
4. If tests fail:
   - Analyze failures
   - Fix the issues
   - Re-run tests
5. Repeat step 4 until all tests are GREEN
6. Produce deliverables (see below)

DELIVERABLES:
- Summary of changes made
- Git diff or patch file
- Path to test artifacts (./artifacts/<timestamp>/)
- List of any remaining risks or todos
- Updated knowledge base files (if system understanding changed)

EXAMPLE OUTPUT:
```
✅ TASK COMPLETE

Summary:
- Implemented user profile edit functionality
- Added ProfileEditModal component
- Connected to backend PUT /api/users/:id endpoint
- All E2E tests passing (15/15)

Changes:
- frontend/components/ProfileEditModal.tsx (new)
- frontend/pages/profile.tsx (modified)
- backend/src/users/users.controller.ts (modified)

Test Results:
- Artifacts: ./artifacts/20260105_143022/
- All tests GREEN ✅
- Screenshot evidence in artifacts/

Remaining Work:
- None, feature complete

Knowledge Base Updates:
- Updated docs/agent/FEATURES.md with profile edit feature
```

---

## EXAMPLE USAGE

### Simple Feature Request
```
[Use template above]

TASK: Add export to CSV button on clients page
```

### Bug Fix Request
```
[Use template above]

TASK: Fix login page not redirecting after successful authentication
```

### Complex Feature
```
[Use template above]

TASK: Implement real-time notifications system
- WebSocket connection to backend
- Toast notifications in UI
- Mark as read functionality
- Persist notification state
```

---

## SAFETY CHECKLIST

Before submitting task, ensure:
- [ ] Task description is clear and specific
- [ ] No requests to expose services publicly
- [ ] No requests to modify secrets or credentials
- [ ] Task is achievable within project scope
- [ ] Tests will validate the changes

---

Last updated: 2026-01-05
