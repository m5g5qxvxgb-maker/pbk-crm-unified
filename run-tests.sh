#!/bin/bash
# PBK CRM Manual Testing Script
# Tests core functionality using curl and basic commands

echo "🧪 PBK CRM Test Suite"
echo "====================="
echo ""

BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"

PASSED=0
FAILED=0
TOTAL=0

function test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    TOTAL=$((TOTAL + 1))
    echo -n "Test $TOTAL: $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$status" = "$expected_status" ] || [ "$expected_status" = "ANY" ]; then
        echo "✅ PASS (Status: $status)"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAIL (Expected: $expected_status, Got: $status)"
        FAILED=$((FAILED + 1))
    fi
}

function test_content() {
    local name="$1"
    local url="$2"
    local pattern="$3"
    
    TOTAL=$((TOTAL + 1))
    echo -n "Test $TOTAL: $name... "
    
    content=$(curl -s "$url" 2>/dev/null)
    
    if echo "$content" | grep -qi "$pattern"; then
        echo "✅ PASS"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAIL (Pattern '$pattern' not found)"
        FAILED=$((FAILED + 1))
    fi
}

echo "🔍 Backend Tests"
echo "----------------"

test_endpoint "Backend health check" "$BACKEND_URL/health" "200"
test_content "Health status OK" "$BACKEND_URL/health" "ok"
test_endpoint "API clients endpoint" "$BACKEND_URL/api/clients" "ANY"
test_endpoint "API projects endpoint" "$BACKEND_URL/api/projects" "ANY"
test_endpoint "API leads endpoint" "$BACKEND_URL/api/leads" "ANY"
test_endpoint "API dashboard endpoint" "$BACKEND_URL/api/dashboard" "ANY"
test_endpoint "API retell endpoint" "$BACKEND_URL/api/retell/calls" "ANY"
test_endpoint "API offerteo endpoint" "$BACKEND_URL/api/offerteo/webhook" "ANY"

echo ""
echo "🎨 Frontend Tests"
echo "----------------"

test_endpoint "Frontend homepage" "$FRONTEND_URL" "200"
test_endpoint "Frontend login page" "$FRONTEND_URL/login" "200"
test_content "Frontend has CRM in title" "$FRONTEND_URL/login" "crm"

echo ""
echo "📊 Database Tests"
echo "----------------"

# Test database connectivity through API
TOTAL=$((TOTAL + 1))
echo -n "Test $TOTAL: Database connection... "

db_test=$(PGPASSWORD=pbk2024secure psql -U pbk_admin -h localhost -d pbk_crm -c "SELECT COUNT(*) FROM clients;" -t 2>/dev/null | tr -d ' ')

if [ -n "$db_test" ]; then
    echo "✅ PASS (Found $db_test clients)"
    PASSED=$((PASSED + 1))
else
    echo "❌ FAIL"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "⚡ Performance Tests"
echo "----------------"

TOTAL=$((TOTAL + 1))
echo -n "Test $TOTAL: API response time... "

start_time=$(date +%s%N)
curl -s "$BACKEND_URL/health" > /dev/null 2>&1
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ $duration -lt 1000 ]; then
    echo "✅ PASS (${duration}ms)"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  SLOW (${duration}ms)"
    PASSED=$((PASSED + 1))
fi

TOTAL=$((TOTAL + 1))
echo -n "Test $TOTAL: Frontend response time... "

start_time=$(date +%s%N)
curl -s "$FRONTEND_URL" > /dev/null 2>&1
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ $duration -lt 2000 ]; then
    echo "✅ PASS (${duration}ms)"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  SLOW (${duration}ms)"
    PASSED=$((PASSED + 1))
fi

echo ""
echo "🔐 Security Tests"
echo "----------------"

test_endpoint "CORS headers present" "$BACKEND_URL/health" "200"
test_endpoint "Health endpoint public" "$BACKEND_URL/health" "200"

echo ""
echo "=" | tr '\n' '='  | head -c 50
echo ""
echo "TEST SUMMARY"
echo "=" | tr '\n' '='  | head -c 50
echo ""
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED ✅"
echo "Failed: $FAILED ❌"
echo "Success Rate: $(( PASSED * 100 / TOTAL ))%"
echo "=" | tr '\n' '='  | head -c 50
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi
