#!/bin/bash

##############################################################################
# API Test Script 3: Voter, Result, and Dashboard Modules
# Description: Tests all endpoints in voter, result, and dashboard modules
# Usage: ./test-script-3-voter-result-dashboard.sh
##############################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000/api"
RESULTS_FILE="test-results-3-voter-result-dashboard.txt"
SUMMARY_FILE="test-summary-3-voter-result-dashboard.json"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data storage
ACCESS_TOKEN=""
VOTER_ID=""
ELECTION_ID=""
RESULT_ID=""

# Initialize results file
echo "==============================================================================" > "$RESULTS_FILE"
echo "API Test Results - Voter, Result, and Dashboard Modules" >> "$RESULTS_FILE"
echo "Test Run: $(date)" >> "$RESULTS_FILE"
echo "==============================================================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""
}

print_module() {
    echo -e "\n${MAGENTA}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║ MODULE: $1${NC}"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_test() {
    echo -e "${BLUE}► Testing:${NC} $1"
}

log_result() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local status_code="$4"
    local response="$5"
    local expected="$6"
    local success="$7"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$success" = "true" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASSED${NC} - $test_name (HTTP $status_code)"
        echo "✓ PASSED - $test_name" >> "$RESULTS_FILE"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAILED${NC} - $test_name (HTTP $status_code)"
        echo "✗ FAILED - $test_name" >> "$RESULTS_FILE"
        echo "  Method: $method" >> "$RESULTS_FILE"
        echo "  Endpoint: $endpoint" >> "$RESULTS_FILE"
        echo "  Status Code: $status_code" >> "$RESULTS_FILE"
        echo "  Expected: $expected" >> "$RESULTS_FILE"
        echo "  Response: $response" >> "$RESULTS_FILE"
    fi

    echo "  Method: $method" >> "$RESULTS_FILE"
    echo "  Endpoint: $endpoint" >> "$RESULTS_FILE"
    echo "  Status Code: $status_code" >> "$RESULTS_FILE"
    echo "" >> "$RESULTS_FILE"
}

api_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"

    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                -w "\n%{http_code}"
        else
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token" \
                -w "\n%{http_code}"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" \
                -w "\n%{http_code}"
        else
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -w "\n%{http_code}"
        fi
    fi
}

extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | sed "s/\"$key\":\"\([^\"]*\)\"/\1/"
}

##############################################################################
# Setup: Login to get access token
##############################################################################

setup_authentication() {
    print_header "SETUP: Authentication"

    TIMESTAMP=$(date +%s)
    TEST_EMAIL="voter${TIMESTAMP}@students.jkuat.ac.ke"
    TEST_STUDENT_ID="VOT$(shuf -i 100-999 -n 1)-${TIMESTAMP:0:4}/2024"
    TEST_PASSWORD="VoterPass123!@#"

    # Register
    echo -e "${BLUE}► Registering test voter...${NC}"
    RESPONSE=$(api_request "POST" "/auth/register" '{
        "studentId": "'"$TEST_STUDENT_ID"'",
        "email": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'",
        "confirmPassword": "'"$TEST_PASSWORD"'",
        "firstName": "Test",
        "lastName": "Voter",
        "faculty": "School of Computing and Information Technology",
        "department": "Computer Science",
        "course": "BSc Computer Science",
        "yearOfStudy": 2,
        "admissionYear": 2023
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)

    if [ "$STATUS" = "201" ] || [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Voter registered successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Registration failed, continuing...${NC}"
    fi

    # Login
    echo -e "${BLUE}► Logging in...${NC}"
    RESPONSE=$(api_request "POST" "/auth/login" '{
        "identifier": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$STATUS" = "200" ]; then
        ACCESS_TOKEN=$(extract_json_value "$BODY" "accessToken")
        VOTER_ID=$(extract_json_value "$BODY" "userId")
        echo -e "${GREEN}✓ Login successful${NC}"
        echo -e "${CYAN}Access Token:${NC} ${ACCESS_TOKEN:0:20}..."
    else
        echo -e "${RED}✗ Login failed${NC}"
    fi
    echo ""
}

##############################################################################
# VOTER MODULE TESTS
##############################################################################

test_voter_module() {
    print_module "VOTER MODULE (18 endpoints)"

    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"

    # 1. POST /voters/register (already tested in setup, but test validation)
    print_test "POST /voters/register - Register voter with invalid data (should fail)"
    RESPONSE=$(api_request "POST" "/voters/register" '{
        "studentId": "INVALID",
        "email": "invalid-email",
        "password": "123"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Register voter with invalid data" "POST" "/voters/register" "$STATUS" "$BODY" "400" $([ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 2. GET /voters/verify-email/:token
    print_test "GET /voters/verify-email/:token - Verify email (will fail with invalid token)"
    RESPONSE=$(api_request "GET" "/voters/verify-email/invalid-token")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Verify email" "GET" "/voters/verify-email/:token" "$STATUS" "$BODY" "400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 3. GET /voters/profile
    print_test "GET /voters/profile - Get voter profile"
    RESPONSE=$(api_request "GET" "/voters/profile" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voter profile" "GET" "/voters/profile" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 4. PUT /voters/profile
    print_test "PUT /voters/profile - Update voter profile"
    RESPONSE=$(api_request "PUT" "/voters/profile" '{
        "firstName": "UpdatedVoter",
        "phone": "+254712345678"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update voter profile" "PUT" "/voters/profile" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 5. POST /voters/profile/picture
    print_test "POST /voters/profile/picture - Upload profile picture"
    RESPONSE=$(api_request "POST" "/voters/profile/picture" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Upload profile picture" "POST" "/voters/profile/picture" "$STATUS" "$BODY" "200/400" $([ "$STATUS" = "400" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 6. GET /voters/eligibility/:electionId
    print_test "GET /voters/eligibility/:electionId - Check election eligibility"
    RESPONSE=$(api_request "GET" "/voters/eligibility/$FAKE_UUID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Check election eligibility" "GET" "/voters/eligibility/:electionId" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 7. GET /voters/voting-history
    print_test "GET /voters/voting-history - Get voting history"
    RESPONSE=$(api_request "GET" "/voters/voting-history" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voting history" "GET" "/voters/voting-history" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 8. POST /voters/resend-verification
    print_test "POST /voters/resend-verification - Resend email verification"
    RESPONSE=$(api_request "POST" "/voters/resend-verification" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Resend email verification" "POST" "/voters/resend-verification" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 9. GET /voters/preferences
    print_test "GET /voters/preferences - Get voter preferences"
    RESPONSE=$(api_request "GET" "/voters/preferences" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voter preferences" "GET" "/voters/preferences" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 10. PUT /voters/preferences
    print_test "PUT /voters/preferences - Update voter preferences"
    RESPONSE=$(api_request "PUT" "/voters/preferences" '{
        "emailNotifications": true,
        "smsNotifications": false
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update voter preferences" "PUT" "/voters/preferences" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 11. GET /voters/statistics (Admin only)
    print_test "GET /voters/statistics - Get voter statistics (Admin required)"
    RESPONSE=$(api_request "GET" "/voters/statistics" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voter statistics" "GET" "/voters/statistics" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 12. GET /voters/search (Admin only)
    print_test "GET /voters/search - Search voters (Admin required)"
    RESPONSE=$(api_request "GET" "/voters/search?search=test" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Search voters" "GET" "/voters/search" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 13. GET /voters/:id (Admin only)
    print_test "GET /voters/:id - Get voter by ID (Admin required)"
    RESPONSE=$(api_request "GET" "/voters/$FAKE_UUID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voter by ID" "GET" "/voters/:id" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 14. PUT /voters/:id/status (Admin only)
    print_test "PUT /voters/:id/status - Update voter status (Admin required)"
    RESPONSE=$(api_request "PUT" "/voters/$FAKE_UUID/status" '{
        "isActive": false,
        "reason": "Testing status update"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update voter status" "PUT" "/voters/:id/status" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 15. POST /voters/import (Admin only)
    print_test "POST /voters/import - Import voters (Admin required)"
    RESPONSE=$(api_request "POST" "/voters/import" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Import voters" "POST" "/voters/import" "$STATUS" "$BODY" "200/400/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 16. POST /voters/bulk-import (Admin only)
    print_test "POST /voters/bulk-import - Bulk import voters (Admin required)"
    RESPONSE=$(api_request "POST" "/voters/bulk-import" '{
        "voters": []
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Bulk import voters" "POST" "/voters/bulk-import" "$STATUS" "$BODY" "200/400/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 17. GET /voters/export (Admin only)
    print_test "GET /voters/export - Export voters (Admin required)"
    RESPONSE=$(api_request "GET" "/voters/export?format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Export voters" "GET" "/voters/export" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 18. DELETE /voters/:id (Super Admin only)
    print_test "DELETE /voters/:id - Delete voter (Super Admin required)"
    RESPONSE=$(api_request "DELETE" "/voters/$FAKE_UUID" '{
        "reason": "Testing voter deletion"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Delete voter" "DELETE" "/voters/:id" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")
}

##############################################################################
# RESULT MODULE TESTS
##############################################################################

test_result_module() {
    print_module "RESULT MODULE (13 endpoints)"

    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"
    ELECTION_ID=$FAKE_UUID

    # 1. POST /results/:electionId/calculate (Admin only)
    print_test "POST /results/:electionId/calculate - Calculate results (Admin required)"
    RESPONSE=$(api_request "POST" "/results/$ELECTION_ID/calculate" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Calculate results" "POST" "/results/:electionId/calculate" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 2. GET /results/:electionId
    print_test "GET /results/:electionId - Get election results"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get election results" "GET" "/results/:electionId" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 3. POST /results/:electionId/publish (Admin only)
    print_test "POST /results/:electionId/publish - Publish results (Admin required)"
    RESPONSE=$(api_request "POST" "/results/$ELECTION_ID/publish" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Publish results" "POST" "/results/:electionId/publish" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 4. GET /results/:electionId/analytics (Admin only)
    print_test "GET /results/:electionId/analytics - Get voting analytics (Admin required)"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/analytics" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voting analytics" "GET" "/results/:electionId/analytics" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 5. GET /results/:electionId/live-stats
    print_test "GET /results/:electionId/live-stats - Get live voting stats"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/live-stats" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get live voting stats" "GET" "/results/:electionId/live-stats" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 6. GET /results/:electionId/export (Admin only)
    print_test "GET /results/:electionId/export - Export results (Admin required)"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/export" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Export results" "GET" "/results/:electionId/export" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 7. GET /results/:electionId/position/:positionId
    print_test "GET /results/:electionId/position/:positionId - Get position results"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/position/$FAKE_UUID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get position results" "GET" "/results/:electionId/position/:positionId" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 8. GET /results/:electionId/candidate/:candidateId/performance (Admin only)
    print_test "GET /results/:electionId/candidate/:candidateId/performance - Get candidate performance (Admin required)"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/candidate/$FAKE_UUID/performance" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get candidate performance" "GET" "/results/:electionId/candidate/:candidateId/performance" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 9. GET /results/:electionId/compare (Admin only)
    print_test "GET /results/:electionId/compare - Compare results (Admin required)"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/compare" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Compare results" "GET" "/results/:electionId/compare" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 10. POST /results/:electionId/verify (Super Admin only)
    print_test "POST /results/:electionId/verify - Verify results integrity (Super Admin required)"
    RESPONSE=$(api_request "POST" "/results/$ELECTION_ID/verify" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Verify results integrity" "POST" "/results/:electionId/verify" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 11. GET /results/:electionId/summary
    print_test "GET /results/:electionId/summary - Get result summary"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/summary" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get result summary" "GET" "/results/:electionId/summary" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 12. GET /results/:electionId/historical-comparison (Admin only)
    print_test "GET /results/:electionId/historical-comparison - Get historical comparison (Admin required)"
    RESPONSE=$(api_request "GET" "/results/$ELECTION_ID/historical-comparison" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get historical comparison" "GET" "/results/:electionId/historical-comparison" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 13. POST /results/:electionId/certificate (Admin only)
    print_test "POST /results/:electionId/certificate - Generate results certificate (Admin required)"
    RESPONSE=$(api_request "POST" "/results/$ELECTION_ID/certificate" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate results certificate" "POST" "/results/:electionId/certificate" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")
}

##############################################################################
# DASHBOARD MODULE TESTS
##############################################################################

test_dashboard_module() {
    print_module "DASHBOARD MODULE (8 endpoints)"

    # 1. GET /dashboard/voter
    print_test "GET /dashboard/voter - Get voter dashboard"
    RESPONSE=$(api_request "GET" "/dashboard/voter" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voter dashboard" "GET" "/dashboard/voter" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 2. GET /dashboard/candidate
    print_test "GET /dashboard/candidate - Get candidate dashboard"
    RESPONSE=$(api_request "GET" "/dashboard/candidate" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get candidate dashboard" "GET" "/dashboard/candidate" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 3. GET /dashboard/admin (Admin only)
    print_test "GET /dashboard/admin - Get admin dashboard (Admin required)"
    RESPONSE=$(api_request "GET" "/dashboard/admin" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get admin dashboard" "GET" "/dashboard/admin" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 4. GET /dashboard/updates
    print_test "GET /dashboard/updates - Get dashboard updates"
    RESPONSE=$(api_request "GET" "/dashboard/updates" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get dashboard updates" "GET" "/dashboard/updates" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 5. POST /dashboard/refresh
    print_test "POST /dashboard/refresh - Refresh dashboard cache"
    RESPONSE=$(api_request "POST" "/dashboard/refresh" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Refresh dashboard cache" "POST" "/dashboard/refresh" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 6. GET /dashboard/stats
    print_test "GET /dashboard/stats - Get dashboard statistics"
    RESPONSE=$(api_request "GET" "/dashboard/stats" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get dashboard statistics" "GET" "/dashboard/stats" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 7. GET /dashboard/notifications
    print_test "GET /dashboard/notifications - Get dashboard notifications"
    RESPONSE=$(api_request "GET" "/dashboard/notifications" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get dashboard notifications" "GET" "/dashboard/notifications" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 8. GET /dashboard/export
    print_test "GET /dashboard/export - Export dashboard data"
    RESPONSE=$(api_request "GET" "/dashboard/export" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Export dashboard data" "GET" "/dashboard/export" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    print_header "STARTING API TESTS - MODULES: Voter, Result, Dashboard"

    echo -e "${CYAN}Base URL:${NC} $BASE_URL"
    echo -e "${CYAN}Results File:${NC} $RESULTS_FILE"
    echo ""

    # Setup
    setup_authentication

    # Run tests
    test_voter_module
    test_result_module
    test_dashboard_module

    # Generate summary
    print_header "TEST SUMMARY"

    echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"

    if [ $TOTAL_TESTS -gt 0 ]; then
        SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
        echo -e "${CYAN}Success Rate:${NC} $SUCCESS_RATE%"
    fi

    echo ""
    echo -e "${YELLOW}Full results written to:${NC} $RESULTS_FILE"

    # Write JSON summary
    cat > "$SUMMARY_FILE" <<EOF
{
  "test_run": "$(date -Iseconds)",
  "modules_tested": ["voter", "result", "dashboard"],
  "total_tests": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "success_rate": "$SUCCESS_RATE%",
  "results_file": "$RESULTS_FILE"
}
EOF

    echo -e "${YELLOW}JSON summary written to:${NC} $SUMMARY_FILE"
    echo ""

    # Write summary to results file
    echo "" >> "$RESULTS_FILE"
    echo "==============================================================================" >> "$RESULTS_FILE"
    echo "TEST SUMMARY" >> "$RESULTS_FILE"
    echo "==============================================================================" >> "$RESULTS_FILE"
    echo "Total Tests: $TOTAL_TESTS" >> "$RESULTS_FILE"
    echo "Passed: $PASSED_TESTS" >> "$RESULTS_FILE"
    echo "Failed: $FAILED_TESTS" >> "$RESULTS_FILE"
    echo "Success Rate: $SUCCESS_RATE%" >> "$RESULTS_FILE"
    echo "==============================================================================" >> "$RESULTS_FILE"
}

# Run main function
main
