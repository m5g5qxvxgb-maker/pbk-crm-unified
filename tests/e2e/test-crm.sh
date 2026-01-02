#!/bin/bash

BASE_URL="http://localhost:3333"
API_URL="http://localhost:5000"

echo "🧪 PBK CRM E2E Testing"
echo "========================================"
echo ""

# Test 1: Frontend pages
echo "1️⃣  Testing Frontend Pages..."
pages=("/" "/login" "/dashboard" "/clients" "/leads" "/calls" "/emails" "/proposals" "/projects" "/settings")

for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${page}")
    if [ "$status" = "200" ]; then
        echo "   ✅ ${page}: ${status}"
    else
        echo "   ❌ ${page}: ${status}"
    fi
done

echo ""
echo "2️⃣  Testing API Endpoints..."
endpoints=("/health" "/api/clients" "/api/leads" "/api/calls" "/api/emails" "/api/proposals" "/api/dashboard/metrics")

for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}${endpoint}")
    if [ "$status" = "200" ] || [ "$status" = "401" ]; then
        echo "   ✅ ${endpoint}: ${status}"
    else
        echo "   ⚠️  ${endpoint}: ${status}"
    fi
done

echo ""
echo "3️⃣  Testing Login API..."
login_response=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pbkconstruction.net","password":"admin123"}')

if echo "$login_response" | grep -q "token"; then
    echo "   ✅ Login successful"
    TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo "   ❌ Login failed"
    echo "   Response: $login_response"
fi

echo ""
echo "4️⃣  Testing Authenticated Endpoints..."
if [ -n "$TOKEN" ]; then
    for endpoint in "/api/clients" "/api/leads" "/api/calls"; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}${endpoint}" \
          -H "Authorization: Bearer ${TOKEN}")
        echo "   ${endpoint}: ${status}"
    done
fi

echo ""
echo "========================================"
echo "✅ Basic E2E Tests Completed"
echo "========================================"
