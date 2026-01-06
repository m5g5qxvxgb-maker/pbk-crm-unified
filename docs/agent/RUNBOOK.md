# RUNBOOK — Deploy, Rollback, Incidents

## Deployment

### Start All Services
```bash
cd /root/pbk-crm-unified
./start-all.sh
```

### Individual Services
```bash
# Frontend
npm run dev:frontend           # Dev mode
npm run start:frontend         # Production

# Backend
npm run dev:backend            # Dev mode
npm run start:backend          # Production

# Database
docker-compose up -d pbk-crm-db

# All via Docker
docker-compose up -d
```

### Verify Deployment
```bash
curl http://localhost:8888     # Frontend
curl http://localhost:3000/health  # Backend
docker ps | grep pbk-crm       # Containers
```

## Rollback Procedure
1. Stop current version: `docker-compose down`
2. Restore database backup (if needed)
3. Checkout previous git commit: `git checkout <commit>`
4. Rebuild: `npm run build`
5. Restart: `./start-all.sh`

## Incidents

### Service Not Responding
```bash
# Check logs
journalctl -u pbk-crm-frontend -n 100
docker logs pbk-crm-db

# Restart service
systemctl restart pbk-crm-frontend
docker-compose restart
```

### Database Connection Issues
```bash
# Check DB is running
docker ps | grep postgres
docker exec -it pbk-crm-db psql -U pbk_user -d pbk_crm

# Reset connection
docker-compose restart pbk-crm-db
```

### Test Failures
```bash
# Run verification script
./scripts/verify.sh

# Check specific test
npx playwright test tests/e2e/crm.spec.js --headed
```

## Backup & Restore
- **Database backup:** `docker exec pbk-crm-db pg_dump -U pbk_user pbk_crm > backup.sql`
- **Restore:** `docker exec -i pbk-crm-db psql -U pbk_user pbk_crm < backup.sql`
- **Code backup:** Git commits + `/srv/backups/`

## Monitoring
- Logs: `/root/pbk-crm-unified/logs/`
- Health: `http://localhost:3000/health`
- Test reports: `/srv/AGENT_KB/test-reports/`

## Last updated
2026-01-05 by OpenCode agent setup
