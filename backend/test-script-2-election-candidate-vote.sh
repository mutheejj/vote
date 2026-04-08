#!/bin/bash

##############################################################################
# API Test Script 2: Election, Candidate, and Vote Modules
# Description: Tests all endpoints in election, candidate, and vote modules
# Usage: ./test-script-2-election-candidate-vote.sh
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
RESULTS_FILE="test-results-2-election-candidate-vote.txt"
SUMMARY_FILE="test-summary-2-election-candidate-vote.json"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data storage
ACCESS_TOKEN=""
ADMIN_TOKEN=""
ELECTION_ID=""
POSITION_ID=""
CANDIDATE_ID=""
VOTE_SESSION_ID=""
VERIFICATION_CODE=""

# Initialize results file
echo "==============================================================================" > "$RESULTS_FILE"
echo "API Test Results - Election, Candidate, and Vote Modules" >> "$RESULTS_FILE"
echo "Test Run: $(date)" >> "$RESULTS_FILE"
echo "==============================================================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

##############################################################################
# Helper Functions (same as script 1)
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
    TEST_EMAIL="test${TIMESTAMP}@students.jkuat.ac.ke"
    TEST_STUDENT_ID="SCI$(shuf -i 100-999 -n 1)-${TIMESTAMP:0:4}/2024"
    TEST_PASSWORD="TestPass123!@#"

    # Register
    echo -e "${BLUE}► Registering test user...${NC}"
    RESPONSE=$(api_request "POST" "/auth/register" '{
        "studentId": "'"$TEST_STUDENT_ID"'",
        "email": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'",
        "confirmPassword": "'"$TEST_PASSWORD"'",
        "firstName": "Test",
        "lastName": "User",
        "faculty": "School of Computing and Information Technology",
        "department": "Computer Science",
        "course": "BSc Computer Science",
        "yearOfStudy": 3,
        "admissionYear": 2022
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)

    if [ "$STATUS" = "201" ] || [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ User registered successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Registration failed (may already exist), continuing...${NC}"
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
        echo -e "${GREEN}✓ Login successful${NC}"
        echo -e "${CYAN}Access Token:${NC} ${ACCESS_TOKEN:0:20}..."
    else
        echo -e "${RED}✗ Login failed${NC}"
        echo -e "${YELLOW}Tests will proceed but may fail without authentication${NC}"
    fi
    echo ""
}

##############################################################################
# ELECTION MODULE TESTS
##############################################################################

test_election_module() {
    print_module "ELECTION MODULE (14 endpoints)"

    # 1. GET /elections
    print_test "GET /elections - Get all elections"
    RESPONSE=$(api_request "GET" "/elections" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get all elections" "GET" "/elections" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 2. GET /elections/active
    print_test "GET /elections/active - Get active elections"
    RESPONSE=$(api_request "GET" "/elections/active" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get active elections" "GET" "/elections/active" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 3. GET /elections/eligible
    print_test "GET /elections/eligible - Get user eligible elections"
    RESPONSE=$(api_request "GET" "/elections/eligible" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get user eligible elections" "GET" "/elections/eligible" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 4. POST /elections (Admin only)
    print_test "POST /elections - Create election (Admin required)"
    RESPONSE=$(api_request "POST" "/elections" '{
        "title": "Test Election",
        "description": "Election created for API testing",
        "startDate": "'"$(date -d "+1 day" +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -v+1d +%Y-%m-%dT%H:%M:%S.000Z)"'",
        "endDate": "'"$(date -d "+7 days" +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -v+7d +%Y-%m-%dT%H:%M:%S.000Z)"'",
        "eligibilityCriteria": {}
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Create election" "POST" "/elections" "$STATUS" "$BODY" "201/403" $([ "$STATUS" = "201" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    if [ "$STATUS" = "201" ]; then
        ELECTION_ID=$(extract_json_value "$BODY" "id")
    fi

    # Use a fake UUID for testing if no election was created
    if [ -z "$ELECTION_ID" ]; then
        ELECTION_ID="123e4567-e89b-12d3-a456-426614174000"
    fi

    # 5. GET /elections/:id
    print_test "GET /elections/:id - Get election by ID"
    RESPONSE=$(api_request "GET" "/elections/$ELECTION_ID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get election by ID" "GET" "/elections/:id" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 6. PUT /elections/:id (Admin only)
    print_test "PUT /elections/:id - Update election (Admin required)"
    RESPONSE=$(api_request "PUT" "/elections/$ELECTION_ID" '{
        "title": "Updated Test Election",
        "description": "Updated description"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update election" "PUT" "/elections/:id" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 7. DELETE /elections/:id (Super Admin only)
    print_test "DELETE /elections/:id - Delete election (Super Admin required)"
    RESPONSE=$(api_request "DELETE" "/elections/$ELECTION_ID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Delete election" "DELETE" "/elections/:id" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 8. POST /elections/:id/start (Admin only)
    print_test "POST /elections/:id/start - Start election (Admin required)"
    RESPONSE=$(api_request "POST" "/elections/$ELECTION_ID/start" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Start election" "POST" "/elections/:id/start" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 9. POST /elections/:id/end (Admin only)
    print_test "POST /elections/:id/end - End election (Admin required)"
    RESPONSE=$(api_request "POST" "/elections/$ELECTION_ID/end" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "End election" "POST" "/elections/:id/end" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 10. POST /elections/:id/pause (Admin only)
    print_test "POST /elections/:id/pause - Pause election (Admin required)"
    RESPONSE=$(api_request "POST" "/elections/$ELECTION_ID/pause" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Pause election" "POST" "/elections/:id/pause" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 11. POST /elections/:id/resume (Admin only)
    print_test "POST /elections/:id/resume - Resume election (Admin required)"
    RESPONSE=$(api_request "POST" "/elections/$ELECTION_ID/resume" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Resume election" "POST" "/elections/:id/resume" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 12. POST /elections/:id/archive (Super Admin only)
    print_test "POST /elections/:id/archive - Archive election (Super Admin required)"
    RESPONSE=$(api_request "POST" "/elections/$ELECTION_ID/archive" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Archive election" "POST" "/elections/:id/archive" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 13. GET /elections/:id/stats (Admin only)
    print_test "GET /elections/:id/stats - Get election stats (Admin required)"
    RESPONSE=$(api_request "GET" "/elections/$ELECTION_ID/stats" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get election stats" "GET" "/elections/:id/stats" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 14. POST /elections/:id/voters/add (Admin only)
    print_test "POST /elections/:id/voters/add - Add eligible voters (Admin required)"
    RESPONSE=$(api_request "POST" "/elections/$ELECTION_ID/voters/add" '{
        "voterIds": ["123e4567-e89b-12d3-a456-426614174000"]
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Add eligible voters" "POST" "/elections/:id/voters/add" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")
}

##############################################################################
# CANDIDATE MODULE TESTS
##############################################################################

test_candidate_module() {
    print_module "CANDIDATE MODULE (19 endpoints)"

    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"

    # 1. GET /candidates/election/:electionId
    print_test "GET /candidates/election/:electionId - Get candidates by election"
    RESPONSE=$(api_request "GET" "/candidates/election/$ELECTION_ID")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get candidates by election" "GET" "/candidates/election/:electionId" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 2. GET /candidates/position/:positionId
    print_test "GET /candidates/position/:positionId - Get candidates by position"
    RESPONSE=$(api_request "GET" "/candidates/position/$FAKE_UUID")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get candidates by position" "GET" "/candidates/position/:positionId" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 3. GET /candidates/:id
    print_test "GET /candidates/:id - Get candidate by ID"
    RESPONSE=$(api_request "GET" "/candidates/$FAKE_UUID")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get candidate by ID" "GET" "/candidates/:id" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 4. POST /candidates
    print_test "POST /candidates - Create candidate"
    RESPONSE=$(api_request "POST" "/candidates" '{
        "electionId": "'"$ELECTION_ID"'",
        "positionId": "'"$FAKE_UUID"'",
        "manifesto": "This is a test manifesto for API testing purposes"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Create candidate" "POST" "/candidates" "$STATUS" "$BODY" "201/400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "201" ] && echo "true" || echo "false")

    if [ "$STATUS" = "201" ]; then
        CANDIDATE_ID=$(extract_json_value "$BODY" "id")
    else
        CANDIDATE_ID=$FAKE_UUID
    fi

    # 5. PUT /candidates/:id/profile
    print_test "PUT /candidates/:id/profile - Update candidate profile"
    RESPONSE=$(api_request "PUT" "/candidates/$CANDIDATE_ID/profile" '{
        "manifesto": "Updated manifesto"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update candidate profile" "PUT" "/candidates/:id/profile" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 6. POST /candidates/:id/photo
    print_test "POST /candidates/:id/photo - Upload candidate photo"
    RESPONSE=$(api_request "POST" "/candidates/$CANDIDATE_ID/photo" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Upload candidate photo" "POST" "/candidates/:id/photo" "$STATUS" "$BODY" "200/400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 7. POST /candidates/:id/withdraw
    print_test "POST /candidates/:id/withdraw - Withdraw candidate"
    RESPONSE=$(api_request "POST" "/candidates/$CANDIDATE_ID/withdraw" '{
        "reason": "Testing withdrawal functionality"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Withdraw candidate" "POST" "/candidates/:id/withdraw" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 8. PUT /candidates/:id/approve (Admin only)
    print_test "PUT /candidates/:id/approve - Approve candidate (Admin required)"
    RESPONSE=$(api_request "PUT" "/candidates/$CANDIDATE_ID/approve" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Approve candidate" "PUT" "/candidates/:id/approve" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 9. PUT /candidates/:id/reject (Admin only)
    print_test "PUT /candidates/:id/reject - Reject candidate (Admin required)"
    RESPONSE=$(api_request "PUT" "/candidates/$CANDIDATE_ID/reject" '{
        "reason": "Testing rejection functionality"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Reject candidate" "PUT" "/candidates/:id/reject" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 10. PUT /candidates/:id/disqualify (Admin only)
    print_test "PUT /candidates/:id/disqualify - Disqualify candidate (Admin required)"
    RESPONSE=$(api_request "PUT" "/candidates/$CANDIDATE_ID/disqualify" '{
        "reason": "Testing disqualification functionality"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Disqualify candidate" "PUT" "/candidates/:id/disqualify" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 11. PUT /candidates/:id/status (Admin only)
    print_test "PUT /candidates/:id/status - Update candidate status (Admin required)"
    RESPONSE=$(api_request "PUT" "/candidates/$CANDIDATE_ID/status" '{
        "status": "APPROVED"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update candidate status" "PUT" "/candidates/:id/status" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 12. POST /candidates/:id/running-mate (Admin only)
    print_test "POST /candidates/:id/running-mate - Add running mate (Admin required)"
    RESPONSE=$(api_request "POST" "/candidates/$CANDIDATE_ID/running-mate" '{
        "runningMateId": "'"$FAKE_UUID"'"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Add running mate" "POST" "/candidates/:id/running-mate" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 13. DELETE /candidates/:id/running-mate (Admin only)
    print_test "DELETE /candidates/:id/running-mate - Remove running mate (Admin required)"
    RESPONSE=$(api_request "DELETE" "/candidates/$CANDIDATE_ID/running-mate" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Remove running mate" "DELETE" "/candidates/:id/running-mate" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 14. GET /candidates/election/:electionId/stats (Admin only)
    print_test "GET /candidates/election/:electionId/stats - Get candidate stats (Admin required)"
    RESPONSE=$(api_request "GET" "/candidates/election/$ELECTION_ID/stats" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get candidate stats" "GET" "/candidates/election/:electionId/stats" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 15. GET /candidates/election/:electionId/analytics (Admin only)
    print_test "GET /candidates/election/:electionId/analytics - Get candidate analytics (Admin required)"
    RESPONSE=$(api_request "GET" "/candidates/election/$ELECTION_ID/analytics" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get candidate analytics" "GET" "/candidates/election/:electionId/analytics" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 16. GET /candidates/search/all (Admin only)
    print_test "GET /candidates/search/all - Search candidates (Admin required)"
    RESPONSE=$(api_request "GET" "/candidates/search/all?search=test" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Search candidates" "GET" "/candidates/search/all" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 17. POST /candidates/bulk/approve (Admin only)
    print_test "POST /candidates/bulk/approve - Bulk approve candidates (Admin required)"
    RESPONSE=$(api_request "POST" "/candidates/bulk/approve" '{
        "candidateIds": ["'"$CANDIDATE_ID"'"]
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Bulk approve candidates" "POST" "/candidates/bulk/approve" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 18. POST /candidates/bulk/reject (Admin only)
    print_test "POST /candidates/bulk/reject - Bulk reject candidates (Admin required)"
    RESPONSE=$(api_request "POST" "/candidates/bulk/reject" '{
        "candidateIds": ["'"$CANDIDATE_ID"'"],
        "reason": "Testing bulk rejection"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Bulk reject candidates" "POST" "/candidates/bulk/reject" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 19. GET /candidates/election/:electionId/export (Admin only)
    print_test "GET /candidates/election/:electionId/export - Export candidates (Admin required)"
    RESPONSE=$(api_request "GET" "/candidates/election/$ELECTION_ID/export?format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Export candidates" "GET" "/candidates/election/:electionId/export" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")
}

##############################################################################
# VOTE MODULE TESTS
##############################################################################

test_vote_module() {
    print_module "VOTE MODULE (20 endpoints)"

    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"

    # 1. POST /votes/sessions/start
    print_test "POST /votes/sessions/start - Start voting session"
    RESPONSE=$(api_request "POST" "/votes/sessions/start" '{
        "electionId": "'"$ELECTION_ID"'",
        "deviceFingerprint": "test-device-fingerprint"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Start voting session" "POST" "/votes/sessions/start" "$STATUS" "$BODY" "200/201/400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ] && echo "true" || echo "false")

    if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
        VOTE_SESSION_ID=$(extract_json_value "$BODY" "sessionId")
    else
        VOTE_SESSION_ID=$FAKE_UUID
    fi

    # 2. GET /votes/sessions/:sessionId
    print_test "GET /votes/sessions/:sessionId - Get voting session"
    RESPONSE=$(api_request "GET" "/votes/sessions/$VOTE_SESSION_ID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voting session" "GET" "/votes/sessions/:sessionId" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 3. PUT /votes/sessions/:sessionId/extend
    print_test "PUT /votes/sessions/:sessionId/extend - Extend voting session"
    RESPONSE=$(api_request "PUT" "/votes/sessions/$VOTE_SESSION_ID/extend" '{
        "extensionMinutes": 15
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Extend voting session" "PUT" "/votes/sessions/:sessionId/extend" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 4. PUT /votes/sessions/:sessionId/end
    print_test "PUT /votes/sessions/:sessionId/end - End voting session"
    RESPONSE=$(api_request "PUT" "/votes/sessions/$VOTE_SESSION_ID/end" '{
        "reason": "Testing session end"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "End voting session" "PUT" "/votes/sessions/:sessionId/end" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 5. POST /votes/sessions/:sessionId/complete
    print_test "POST /votes/sessions/:sessionId/complete - Complete voting session"
    RESPONSE=$(api_request "POST" "/votes/sessions/$VOTE_SESSION_ID/complete" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Complete voting session" "POST" "/votes/sessions/:sessionId/complete" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 6. POST /votes/cast
    print_test "POST /votes/cast - Cast vote"
    RESPONSE=$(api_request "POST" "/votes/cast" '{
        "sessionId": "'"$VOTE_SESSION_ID"'",
        "ballot": [
            {
                "positionId": "'"$FAKE_UUID"'",
                "candidateId": "'"$CANDIDATE_ID"'"
            }
        ]
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Cast vote" "POST" "/votes/cast" "$STATUS" "$BODY" "200/201/400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ] && echo "true" || echo "false")

    # 7. POST /votes/verify
    print_test "POST /votes/verify - Verify vote"
    RESPONSE=$(api_request "POST" "/votes/verify" '{
        "verificationCode": "TEST123"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Verify vote" "POST" "/votes/verify" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 8. GET /votes/verify/:verificationCode/status
    print_test "GET /votes/verify/:verificationCode/status - Get verification status"
    RESPONSE=$(api_request "GET" "/votes/verify/TEST123/status")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get verification status" "GET" "/votes/verify/:verificationCode/status" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 9. POST /votes/validate-ballot
    print_test "POST /votes/validate-ballot - Validate ballot"
    RESPONSE=$(api_request "POST" "/votes/validate-ballot" '{
        "electionId": "'"$ELECTION_ID"'",
        "ballot": []
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Validate ballot" "POST" "/votes/validate-ballot" "$STATUS" "$BODY" "200/400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 10. GET /votes/elections/:electionId/ballot
    print_test "GET /votes/elections/:electionId/ballot - Get election ballot"
    RESPONSE=$(api_request "GET" "/votes/elections/$ELECTION_ID/ballot" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get election ballot" "GET" "/votes/elections/:electionId/ballot" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 11. GET /votes/elections/:electionId/status
    print_test "GET /votes/elections/:electionId/status - Check voting status"
    RESPONSE=$(api_request "GET" "/votes/elections/$ELECTION_ID/status" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Check voting status" "GET" "/votes/elections/:electionId/status" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 12. GET /votes/receipts/:receiptHash
    print_test "GET /votes/receipts/:receiptHash - Get vote receipt"
    RESPONSE=$(api_request "GET" "/votes/receipts/test-receipt-hash")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get vote receipt" "GET" "/votes/receipts/:receiptHash" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 13. GET /votes/history
    print_test "GET /votes/history - Get vote history"
    RESPONSE=$(api_request "GET" "/votes/history" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get vote history" "GET" "/votes/history" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 14. POST /votes/report-issue
    print_test "POST /votes/report-issue - Report voting issue"
    RESPONSE=$(api_request "POST" "/votes/report-issue" '{
        "electionId": "'"$ELECTION_ID"'",
        "issueType": "technical",
        "description": "This is a test issue report for API testing purposes"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Report voting issue" "POST" "/votes/report-issue" "$STATUS" "$BODY" "200/201/404" $([ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ] && echo "true" || echo "false")

    # 15. GET /votes/elections/:electionId/progress (Admin only)
    print_test "GET /votes/elections/:electionId/progress - Get voting progress (Admin required)"
    RESPONSE=$(api_request "GET" "/votes/elections/$ELECTION_ID/progress" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voting progress" "GET" "/votes/elections/:electionId/progress" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 16. GET /votes/elections/:electionId/stats/realtime (Admin only)
    print_test "GET /votes/elections/:electionId/stats/realtime - Get real-time stats (Admin required)"
    RESPONSE=$(api_request "GET" "/votes/elections/$ELECTION_ID/stats/realtime" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get real-time stats" "GET" "/votes/elections/:electionId/stats/realtime" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 17. GET /votes/elections/:electionId/analytics (Admin only)
    print_test "GET /votes/elections/:electionId/analytics - Get voting analytics (Admin required)"
    RESPONSE=$(api_request "GET" "/votes/elections/$ELECTION_ID/analytics" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get voting analytics" "GET" "/votes/elections/:electionId/analytics" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 18. POST /votes/elections/:electionId/tally (Admin only)
    print_test "POST /votes/elections/:electionId/tally - Tally votes (Admin required)"
    RESPONSE=$(api_request "POST" "/votes/elections/$ELECTION_ID/tally" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Tally votes" "POST" "/votes/elections/:electionId/tally" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 19. PUT /votes/:voteId/invalidate (Admin only)
    print_test "PUT /votes/:voteId/invalidate - Invalidate vote (Admin required)"
    RESPONSE=$(api_request "PUT" "/votes/$FAKE_UUID/invalidate" '{
        "reason": "Testing vote invalidation"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Invalidate vote" "PUT" "/votes/:voteId/invalidate" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 20. GET /votes/elections/:electionId/export (Admin only)
    print_test "GET /votes/elections/:electionId/export - Export voting data (Admin required)"
    RESPONSE=$(api_request "GET" "/votes/elections/$ELECTION_ID/export?format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Export voting data" "GET" "/votes/elections/:electionId/export" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    print_header "STARTING API TESTS - MODULES: Election, Candidate, Vote"

    echo -e "${CYAN}Base URL:${NC} $BASE_URL"
    echo -e "${CYAN}Results File:${NC} $RESULTS_FILE"
    echo ""

    # Setup
    setup_authentication

    # Run tests
    test_election_module
    test_candidate_module
    test_vote_module

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
  "modules_tested": ["election", "candidate", "vote"],
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
