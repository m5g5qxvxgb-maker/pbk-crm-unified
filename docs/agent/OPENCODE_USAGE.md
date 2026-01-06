# OpenCode Agent — Usage Guide

## Access OpenCode

### 1. Via Tailscale (from any device in your tailnet)
```bash
# Health check
curl https://appp2p-01.tail96f20b.ts.net/global/health

# Documentation
open https://appp2p-01.tail96f20b.ts.net/doc
```

### 2. Via localhost (on server only)
```bash
curl http://127.0.0.1:4096/global/health
```

## OpenCode API Examples

### Basic Health Check
```bash
curl https://appp2p-01.tail96f20b.ts.net/global/health
# Response: {"healthy":true,"version":"1.1.2"}
```

### Get Documentation
```bash
curl https://appp2p-01.tail96f20b.ts.net/doc
```

### Send Task to Agent (Example)
```bash
# Note: Exact API depends on OpenCode version
# Check /doc for full API reference

curl -X POST https://appp2p-01.tail96f20b.ts.net/api/task \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Read docs/agent/*.md, implement feature X, run tests until green",
    "context": {
      "repo": "/root/pbk-crm-unified",
      "branch": "main"
    }
  }'
```

## From VSCode / IDE

### Using VSCode Remote SSH
1. Connect to server via SSH
2. Open folder: `/root/pbk-crm-unified`
3. Terminal → Run: `./scripts/verify.sh`

### Using Browser
1. Open: `https://appp2p-01.tail96f20b.ts.net/doc`
2. Follow OpenCode web UI instructions

### Using CLI (if OpenCode supports)
```bash
# From your local machine (in tailnet)
export OPENCODE_URL=https://appp2p-01.tail96f20b.ts.net
opencode task "Implement feature X and run tests"
```

## Workflow Example

### Manual Task Submission
```bash
# 1. Check agent is healthy
curl https://appp2p-01.tail96f20b.ts.net/global/health

# 2. Submit task (adjust API based on OpenCode docs)
curl -X POST https://appp2p-01.tail96f20b.ts.net/api/chat \
  -H "Content-Type: application/json" \
  -d @task.json

# 3. Check status
curl https://appp2p-01.tail96f20b.ts.net/api/task/123/status
```

### Using OpenCode Template Prompt
See `docs/agent/OPENCODE_TASK_TEMPLATE.md` for the standard prompt format.

## Security Notes
- ✅ OpenCode accessible ONLY via Tailscale (private network)
- ✅ NO public internet access
- ✅ Localhost binding (127.0.0.1:4096)
- ⚠️ Do NOT expose publicly or via Funnel

## Troubleshooting

### Agent not responding
```bash
# Check service status
ssh appp2p-01
sudo systemctl status opencode@root.service

# Check logs
sudo journalctl -u opencode@root.service -n 50 -f

# Restart if needed
sudo systemctl restart opencode@root.service
```

### Can't access via Tailscale
```bash
# Verify Tailscale serve is running
ssh appp2p-01
sudo tailscale serve status

# Should show: https://appp2p-01.tail96f20b.ts.net → http://127.0.0.1:4096
```

## Last updated
2026-01-05 by setup automation
