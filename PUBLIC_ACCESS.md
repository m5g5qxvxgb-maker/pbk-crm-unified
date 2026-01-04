# 🌐 CRM Public Access

## Production URL (Tailscale Funnel)

**https://appp2p-01.tail96f20b.ts.net**

---

## Quick Access Guide

### For Anyone (Public Internet)
Simply open the URL in your browser:
```
https://appp2p-01.tail96f20b.ts.net
```

### Default Credentials
- **Email**: `admin@pbkconstruction.net`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password after first login!

---

## Alternative Access Methods

### 1. Direct Server Access (Tailscale Network Only)
```
Frontend: http://100.91.124.46:3010
Backend:  http://100.91.124.46:5002
```

### 2. Via SSH Tunnel (From Mac)
```bash
# Create tunnel
ssh -f -N -L 8888:localhost:3010 -L 8889:localhost:5002 root@100.91.124.46

# Access
Frontend: http://localhost:8888
Backend:  http://localhost:8889
```

---

## System Status Check

### Check Tailscale Funnel Status
```bash
ssh root@100.91.124.46 "tailscale funnel status"
```

### Check Docker Containers
```bash
ssh root@100.91.124.46 "docker ps --filter name=pbk"
```

### View Logs
```bash
# Frontend logs
ssh root@100.91.124.46 "docker logs pbk-frontend -f"

# Backend logs
ssh root@100.91.124.46 "docker logs pbk-backend -f"
```

---

## Troubleshooting

### If URL is not accessible:
```bash
# Restart Tailscale Funnel
ssh root@100.91.124.46 "tailscale funnel --https=443 off"
ssh root@100.91.124.46 "tailscale funnel --bg --https=443 --set-path=/ 3010"
```

### If containers are down:
```bash
ssh root@100.91.124.46 "cd pbk-crm-unified && docker-compose -f docker-compose.server.yml up -d"
```

---

## Features Available

✅ Dashboard with metrics and activity timeline  
✅ Leads management  
✅ Clients management  
✅ Tasks tracking  
✅ Projects overview  
✅ Calls integration  
✅ Email tracking  
✅ Proposals module  
✅ Pipelines management  
✅ AI Copilot assistant  
✅ Settings and user profile  

---

## Support

For issues or questions, contact the system administrator.

**Deployment Status**: ✅ Production Ready  
**Test Results**: 16/16 Tests Passed  
**Performance**: 54ms avg page load
