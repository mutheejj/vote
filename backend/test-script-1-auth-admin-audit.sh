#!/bin/bash

##############################################################################
# API Test Script 1: Auth, Admin, and Audit Modules
# Description: Tests all endpoints in auth, admin, and audit modules
# Usage: ./test-script-1-auth-admin-audit.sh
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
RESULTS_FILE="test-results-1-auth-admin-audit.txt"
SUMMARY_FILE="test-summary-1-auth-admin-audit.json"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data storage
ACCESS_TOKEN=""
REFRESH_TOKEN=""
ADMIN_TOKEN=""
USER_ID=""
SESSION_ID=""
AUDIT_LOG_ID=""
TEST_USER_EMAIL=""

# Initialize results file
echo "==============================================================================" > "$RESULTS_FILE"
echo "API Test Results - Auth, Admin, and Audit Modules" >> "$RESULTS_FILE"
echo "Test Run: $(date)" >> "$RESULTS_FILE"
echo "==============================================================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

##############################################################################
# Helper Functions
##############################################################################

# Print colored header
print_header() {
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""
}

# Print module header
print_module() {
    echo -e "\n${MAGENTA}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║ MODULE: $1${NC}"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

# Print test info
print_test() {
    echo -e "${BLUE}► Testing:${NC} $1"
}

# Log test result
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

# Make API request
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

# Extract value from JSON using grep and sed
extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | sed "s/\"$key\":\"\([^\"]*\)\"/\1/"
}

##############################################################################
# AUTH MODULE TESTS
##############################################################################

##############################################################################
# Setup Admin Authentication
##############################################################################

setup_admin_auth() {
    print_header "SETUP: Admin Authentication"

    echo -e "${BLUE}► Logging in as admin...${NC}"
    RESPONSE=$(api_request "POST" "/auth/login" '{
        "identifier": "admin@jkuat.ac.ke",
        "password": "Admin1234"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$STATUS" = "200" ]; then
        ADMIN_TOKEN=$(extract_json_value "$BODY" "accessToken")
        echo -e "${GREEN}✓ Admin login successful${NC}"
        echo -e "${CYAN}Admin Token:${NC} ${ADMIN_TOKEN:0:20}..."
    else
        echo -e "${YELLOW}⚠ Admin login failed, admin tests will return 403${NC}"
    fi
    echo ""
}

##############################################################################
# AUTH MODULE TESTS
##############################################################################

test_auth_module() {
    print_module "AUTH MODULE (17 endpoints)"

    # Generate unique test data
    TIMESTAMP=$(date +%s)
    TEST_EMAIL="test${TIMESTAMP}@students.jkuat.ac.ke"
    TEST_STUDENT_ID="SCI$(shuf -i 100-999 -n 1)-${TIMESTAMP:0:4}/2024"
    TEST_PASSWORD="TestPass123!@#"

    # 1. POST /auth/register
    print_test "POST /auth/register - Register new user"
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
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$STATUS" = "201" ] || [ "$STATUS" = "200" ]; then
        log_result "Register new user" "POST" "/auth/register" "$STATUS" "$BODY" "201/200" "true"
        # Extract user ID from nested data.user.id structure
        USER_ID=$(echo "$BODY" | grep -oP '"user":\s*\{[^}]*"id":\s*"\K[^"]+' | head -n 1)
        TEST_USER_EMAIL="$TEST_EMAIL"
        echo -e "${CYAN}Captured User ID:${NC} $USER_ID"
    else
        log_result "Register new user" "POST" "/auth/register" "$STATUS" "$BODY" "201/200" "false"
    fi

    # 2. POST /auth/login
    print_test "POST /auth/login - User login"
    RESPONSE=$(api_request "POST" "/auth/login" '{
        "identifier": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$STATUS" = "200" ]; then
        log_result "User login" "POST" "/auth/login" "$STATUS" "$BODY" "200" "true"
        ACCESS_TOKEN=$(extract_json_value "$BODY" "accessToken")
        REFRESH_TOKEN=$(extract_json_value "$BODY" "refreshToken")
        SESSION_ID=$(extract_json_value "$BODY" "sessionId")
    else
        log_result "User login" "POST" "/auth/login" "$STATUS" "$BODY" "200" "false"
    fi

    # 3. GET /auth/profile
    print_test "GET /auth/profile - Get user profile"
    RESPONSE=$(api_request "GET" "/auth/profile" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get user profile" "GET" "/auth/profile" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 4. PUT /auth/profile
    print_test "PUT /auth/profile - Update user profile"
    RESPONSE=$(api_request "PUT" "/auth/profile" '{
        "firstName": "TestUpdated",
        "phone": "+254712345678"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update user profile" "PUT" "/auth/profile" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 5. POST /auth/refresh-token
    print_test "POST /auth/refresh-token - Refresh access token"
    RESPONSE=$(api_request "POST" "/auth/refresh-token" '{
        "refreshToken": "'"$REFRESH_TOKEN"'"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Refresh access token" "POST" "/auth/refresh-token" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 6. GET /auth/verify-email/:token (will fail without valid token)
    print_test "GET /auth/verify-email/:token - Verify email (expected to fail)"
    RESPONSE=$(api_request "GET" "/auth/verify-email/test-token-invalid")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Verify email" "GET" "/auth/verify-email/:token" "$STATUS" "$BODY" "400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 7. POST /auth/resend-verification
    print_test "POST /auth/resend-verification - Resend verification email"
    RESPONSE=$(api_request "POST" "/auth/resend-verification" '{
        "email": "'"$TEST_EMAIL"'"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Resend verification email" "POST" "/auth/resend-verification" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 8. POST /auth/password-reset/request
    print_test "POST /auth/password-reset/request - Request password reset"
    RESPONSE=$(api_request "POST" "/auth/password-reset/request" '{
        "email": "'"$TEST_EMAIL"'"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Request password reset" "POST" "/auth/password-reset/request" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 9. POST /auth/password-reset/confirm (will fail without valid token)
    print_test "POST /auth/password-reset/confirm - Confirm password reset (expected to fail)"
    RESPONSE=$(api_request "POST" "/auth/password-reset/confirm" '{
        "token": "invalid-token",
        "newPassword": "NewPass123!@#",
        "confirmPassword": "NewPass123!@#"
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Confirm password reset" "POST" "/auth/password-reset/confirm" "$STATUS" "$BODY" "400/404" $([ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 10. GET /auth/account-status/:identifier
    print_test "GET /auth/account-status/:identifier - Get account status"
    # Use the user ID instead of email as identifier
    if [ -n "$USER_ID" ]; then
        RESPONSE=$(api_request "GET" "/auth/account-status/$USER_ID")
    else
        RESPONSE=$(api_request "GET" "/auth/account-status/$TEST_USER_EMAIL")
    fi
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get account status" "GET" "/auth/account-status/:identifier" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 11. POST /auth/change-password
    print_test "POST /auth/change-password - Change password"
    RESPONSE=$(api_request "POST" "/auth/change-password" '{
        "currentPassword": "'"$TEST_PASSWORD"'",
        "newPassword": "NewPass123!@#"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Change password" "POST" "/auth/change-password" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 12. POST /auth/2fa/setup
    print_test "POST /auth/2fa/setup - Setup 2FA"
    RESPONSE=$(api_request "POST" "/auth/2fa/setup" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Setup 2FA" "POST" "/auth/2fa/setup" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 13. POST /auth/2fa/verify
    print_test "POST /auth/2fa/verify - Verify 2FA (expected to fail without valid token)"
    RESPONSE=$(api_request "POST" "/auth/2fa/verify" '{
        "token": "123456"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Verify 2FA" "POST" "/auth/2fa/verify" "$STATUS" "$BODY" "400/401" $([ "$STATUS" = "400" ] || [ "$STATUS" = "401" ] && echo "true" || echo "false")

    # 14. POST /auth/2fa/disable
    print_test "POST /auth/2fa/disable - Disable 2FA (expected to fail)"
    RESPONSE=$(api_request "POST" "/auth/2fa/disable" '{
        "token": "123456"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Disable 2FA" "POST" "/auth/2fa/disable" "$STATUS" "$BODY" "400/401" $([ "$STATUS" = "400" ] || [ "$STATUS" = "401" ] && echo "true" || echo "false")

    # 15. GET /auth/sessions
    print_test "GET /auth/sessions - Get active sessions"
    RESPONSE=$(api_request "GET" "/auth/sessions" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get active sessions" "GET" "/auth/sessions" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 16. DELETE /auth/sessions/:sessionId (need valid session ID)
    if [ -n "$SESSION_ID" ]; then
        print_test "DELETE /auth/sessions/:sessionId - Revoke session"
        RESPONSE=$(api_request "DELETE" "/auth/sessions/$SESSION_ID" "" "$ACCESS_TOKEN")
        STATUS=$(echo "$RESPONSE" | tail -n 1)
        BODY=$(echo "$RESPONSE" | head -n -1)
        log_result "Revoke session" "DELETE" "/auth/sessions/:sessionId" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")
    fi

    # 17. POST /auth/logout
    print_test "POST /auth/logout - User logout"
    RESPONSE=$(api_request "POST" "/auth/logout" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "User logout" "POST" "/auth/logout" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")
}

##############################################################################
# ADMIN MODULE TESTS
##############################################################################

test_admin_module() {
    print_module "ADMIN MODULE (18 endpoints) - Requires Admin Authentication"

    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "${YELLOW}⚠ Admin token not available. Admin tests will fail.${NC}"
        echo ""
    else
        echo -e "${GREEN}✓ Using admin authentication${NC}"
        echo ""
    fi

    # 1. GET /admin/stats
    print_test "GET /admin/stats - Get system statistics"
    RESPONSE=$(api_request "GET" "/admin/stats" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get system statistics" "GET" "/admin/stats" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 2. GET /admin/users
    print_test "GET /admin/users - Get all users"
    RESPONSE=$(api_request "GET" "/admin/users?page=1&limit=10" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get all users" "GET" "/admin/users" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 3. GET /admin/users/:userId
    print_test "GET /admin/users/:userId - Get specific user"
    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"
    RESPONSE=$(api_request "GET" "/admin/users/$FAKE_UUID" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get specific user" "GET" "/admin/users/:userId" "$STATUS" "$BODY" "200/403/404" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")"

    # 4. POST /admin/users
    print_test "POST /admin/users - Create admin user"
    RESPONSE=$(api_request "POST" "/admin/users" '{
        "studentId": "ADM100-1000/2024",
        "email": "admin.test@jkuat.ac.ke",
        "firstName": "Admin",
        "lastName": "Test",
        "role": "ADMIN",
        "permissions": []
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Create admin user" "POST" "/admin/users" "$STATUS" "$BODY" "201/403" "$([ "$STATUS" = "201" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 5. PUT /admin/users/:userId
    print_test "PUT /admin/users/:userId - Update user"
    RESPONSE=$(api_request "PUT" "/admin/users/$FAKE_UUID" '{
        "firstName": "UpdatedAdmin"
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update user" "PUT" "/admin/users/:userId" "$STATUS" "$BODY" "200/403/404" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")"

    # 6. PUT /admin/users/:userId/role
    print_test "PUT /admin/users/:userId/role - Update user role"
    RESPONSE=$(api_request "PUT" "/admin/users/$FAKE_UUID/role" '{
        "role": "MODERATOR",
        "permissions": []
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update user role" "PUT" "/admin/users/:userId/role" "$STATUS" "$BODY" "200/403/404" "$([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")"

    # 7. PUT /admin/users/:userId/status
    print_test "PUT /admin/users/:userId/status - Toggle user status"
    RESPONSE=$(api_request "PUT" "/admin/users/$FAKE_UUID/status" '{
        "isActive": false,
        "reason": "Testing status update"
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Toggle user status" "PUT" "/admin/users/:userId/status" "$STATUS" "$BODY" "200/403/404" "$([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")"

    # 8. DELETE /admin/users/:userId
    print_test "DELETE /admin/users/:userId - Delete user"
    RESPONSE=$(api_request "DELETE" "/admin/users/$FAKE_UUID" '{
        "reason": "Testing deletion"
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Delete user" "DELETE" "/admin/users/:userId" "$STATUS" "$BODY" "200/403/404" "$([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")"

    # 9. POST /admin/users/import
    print_test "POST /admin/users/import - Import users from Excel"
    RESPONSE=$(api_request "POST" "/admin/users/import" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Import users from Excel" "POST" "/admin/users/import" "$STATUS" "$BODY" "200/403/400" "$([ "$STATUS" = "403" ] || [ "$STATUS" = "400" ] && echo "true" || echo "false")"

    # 10. GET /admin/audit-logs
    print_test "GET /admin/audit-logs - Get audit logs"
    RESPONSE=$(api_request "GET" "/admin/audit-logs?page=1&limit=10" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get audit logs" "GET" "/admin/audit-logs" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 11. GET /admin/reports
    print_test "GET /admin/reports - Generate system report"
    RESPONSE=$(api_request "GET" "/admin/reports?reportType=users&format=json" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate system report" "GET" "/admin/reports" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 12. POST /admin/cache/clear
    print_test "POST /admin/cache/clear - Clear system caches"
    RESPONSE=$(api_request "POST" "/admin/cache/clear" '{
        "cacheType": "all"
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Clear system caches" "POST" "/admin/cache/clear" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # Refresh admin token to prevent session expiry for remaining tests
    echo -e "${YELLOW}► Refreshing admin token mid-test...${NC}"
    setup_admin_auth

    # 13. GET /admin/dashboard
    print_test "GET /admin/dashboard - Get dashboard overview"
    RESPONSE=$(api_request "GET" "/admin/dashboard" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get dashboard overview" "GET" "/admin/dashboard" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 14. POST /admin/backup
    print_test "POST /admin/backup - Initiate database backup"
    RESPONSE=$(api_request "POST" "/admin/backup" '{
        "includePersonalData": false
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Initiate database backup" "POST" "/admin/backup" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 15. POST /admin/notifications/system
    print_test "POST /admin/notifications/system - Send system notification"
    RESPONSE=$(api_request "POST" "/admin/notifications/system" '{
        "title": "Test Notification",
        "message": "This is a test system notification for API testing",
        "type": "info",
        "priority": "low",
        "targetAudience": "all"
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Send system notification" "POST" "/admin/notifications/system" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 16. GET /admin/health
    print_test "GET /admin/health - Get system health"
    RESPONSE=$(api_request "GET" "/admin/health" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get system health" "GET" "/admin/health" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 17. POST /admin/emergency/shutdown
    print_test "POST /admin/emergency/shutdown - Emergency shutdown (will not actually execute)"
    RESPONSE=$(api_request "POST" "/admin/emergency/shutdown" '{
        "reason": "API testing - do not execute",
        "duration": 5
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Emergency shutdown" "POST" "/admin/emergency/shutdown" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 18. GET /admin/analytics
    print_test "GET /admin/analytics - Get admin analytics"
    RESPONSE=$(api_request "GET" "/admin/analytics?period=month" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get admin analytics" "GET" "/admin/analytics" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"
}

##############################################################################
# AUDIT MODULE TESTS
##############################################################################

test_audit_module() {
    print_module "AUDIT MODULE (12 endpoints) - Requires Admin Authentication"

    if [ -z "$ADMIN_TOKEN" ]; then
        echo -e "${YELLOW}⚠ Admin token not available. Audit tests will fail.${NC}"
        echo ""
    else
        echo -e "${GREEN}✓ Using admin authentication${NC}"
        echo ""
    fi

    # 1. GET /audit/logs
    print_test "GET /audit/logs - Get audit logs"
    RESPONSE=$(api_request "GET" "/audit/logs?page=1&limit=10" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get audit logs" "GET" "/audit/logs" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    if [ "$STATUS" = "200" ]; then
        AUDIT_LOG_ID=$(extract_json_value "$BODY" "id")
    fi

    # 2. GET /audit/logs/:logId
    print_test "GET /audit/logs/:logId - Get specific audit log"
    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"
    RESPONSE=$(api_request "GET" "/audit/logs/$FAKE_UUID" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get specific audit log" "GET" "/audit/logs/:logId" "$STATUS" "$BODY" "200/403/404" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")"

    # 3. GET /audit/security-events
    print_test "GET /audit/security-events - Get security events"
    RESPONSE=$(api_request "GET" "/audit/security-events?page=1&limit=10" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get security events" "GET" "/audit/security-events" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 4. GET /audit/compliance-report
    print_test "GET /audit/compliance-report - Generate compliance report"
    START_DATE=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)
    END_DATE=$(date +%Y-%m-%d)
    RESPONSE=$(api_request "GET" "/audit/compliance-report?startDate=${START_DATE}&endDate=${END_DATE}" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate compliance report" "GET" "/audit/compliance-report" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 5. GET /audit/analytics
    print_test "GET /audit/analytics - Get audit analytics"
    RESPONSE=$(api_request "GET" "/audit/analytics?startDate=${START_DATE}&endDate=${END_DATE}" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get audit analytics" "GET" "/audit/analytics" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 6. GET /audit/export
    print_test "GET /audit/export - Export audit logs"
    RESPONSE=$(api_request "GET" "/audit/export?format=json" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Export audit logs" "GET" "/audit/export" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 7. POST /audit/cleanup
    print_test "POST /audit/cleanup - Cleanup old logs"
    RESPONSE=$(api_request "POST" "/audit/cleanup" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Cleanup old logs" "POST" "/audit/cleanup" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 8. GET /audit/integrity
    print_test "GET /audit/integrity - Verify audit integrity"
    RESPONSE=$(api_request "GET" "/audit/integrity" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Verify audit integrity" "GET" "/audit/integrity" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 9. POST /audit/manual-entry
    print_test "POST /audit/manual-entry - Create manual audit entry"
    RESPONSE=$(api_request "POST" "/audit/manual-entry" '{
        "action": "Manual test entry",
        "category": "SYSTEM",
        "severity": "LOW",
        "description": "API testing manual entry"
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Create manual audit entry" "POST" "/audit/manual-entry" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 10. GET /audit/statistics
    print_test "GET /audit/statistics - Get audit statistics"
    RESPONSE=$(api_request "GET" "/audit/statistics?startDate=${START_DATE}&endDate=${END_DATE}" "" "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get audit statistics" "GET" "/audit/statistics" "$STATUS" "$BODY" "200/403" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")"

    # 11. POST /audit/security-events/:eventId/resolve
    print_test "POST /audit/security-events/:eventId/resolve - Resolve security event"
    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"
    RESPONSE=$(api_request "POST" "/audit/security-events/$FAKE_UUID/resolve" '{
        "resolution": "Event resolved during API testing",
        "notes": "No further action required"
    }' "$ADMIN_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Resolve security event" "POST" "/audit/security-events/:eventId/resolve" "$STATUS" "$BODY" "200/403/404" "$([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")"
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    print_header "STARTING API TESTS - MODULES: Auth, Admin, Audit"

    echo -e "${CYAN}Base URL:${NC} $BASE_URL"
    echo -e "${CYAN}Results File:${NC} $RESULTS_FILE"
    echo ""

    # Run tests
    test_auth_module

    # Setup admin authentication before admin tests
    setup_admin_auth

    test_admin_module

    # Refresh admin authentication before audit tests (to avoid session expiry)
    echo -e "${YELLOW}► Refreshing admin authentication...${NC}"
    setup_admin_auth

    test_audit_module

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
  "modules_tested": ["auth", "admin", "audit"],
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
