# DECISIONS — Important Decisions and Rationale

## Architecture Decisions

### 1. Tailscale-Only Access (Dec 2025)
**Decision:** No public internet access, Tailscale private network only  
**Rationale:** Security first approach, prevent unauthorized access  
**Impact:** More secure, but requires Tailscale client on all devices  

### 2. Monorepo Structure
**Decision:** Single repo with frontend/backend/agent/bot  
**Rationale:** Easier development, shared types, simpler deployment  
**Impact:** Faster iteration, but larger codebase  

### 3. Playwright for E2E Tests
**Decision:** Use Playwright instead of Cypress  
**Rationale:** Better cross-browser support, faster execution  
**Impact:** Reliable test suite, headless server support  

### 4. Docker Compose for Deployment
**Decision:** Docker Compose instead of Kubernetes  
**Rationale:** Simpler for single-server deployment  
**Impact:** Easy to maintain, sufficient for current scale  

### 5. PostgreSQL Database
**Decision:** PostgreSQL instead of MongoDB  
**Rationale:** ACID compliance, better for relational data  
**Impact:** Reliable transactions, good query performance  

### 6. OpenCode Agent Integration (Jan 2026)
**Decision:** Add OpenCode as autonomous agent for development  
**Rationale:** Automate implement → test → fix loop  
**Impact:** Faster feature delivery, consistent quality  

## Last updated
2026-01-05 by OpenCode agent setup
