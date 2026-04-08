#!/bin/bash

##############################################################################
# API Test Script 4: Notification, Report, and File Modules
# Description: Tests all endpoints in notification, report, and file modules
# Usage: ./test-script-4-notification-report-file.sh
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
RESULTS_FILE="test-results-4-notification-report-file.txt"
SUMMARY_FILE="test-summary-4-notification-report-file.json"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data storage
ACCESS_TOKEN=""
NOTIFICATION_ID=""
REPORT_ID=""

# Initialize results file
echo "==============================================================================" > "$RESULTS_FILE"
echo "API Test Results - Notification, Report, and File Modules" >> "$RESULTS_FILE"
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
    TEST_EMAIL="notif${TIMESTAMP}@students.jkuat.ac.ke"
    TEST_STUDENT_ID="NOT$(shuf -i 100-999 -n 1)-${TIMESTAMP:0:4}/2024"
    TEST_PASSWORD="NotifPass123!@#"

    # Register
    echo -e "${BLUE}► Registering test user...${NC}"
    RESPONSE=$(api_request "POST" "/auth/register" '{
        "studentId": "'"$TEST_STUDENT_ID"'",
        "email": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'",
        "confirmPassword": "'"$TEST_PASSWORD"'",
        "firstName": "Notification",
        "lastName": "Tester",
        "faculty": "School of Computing and Information Technology",
        "department": "Information Technology",
        "course": "BSc Information Technology",
        "yearOfStudy": 1,
        "admissionYear": 2024
    }')
    STATUS=$(echo "$RESPONSE" | tail -n 1)

    if [ "$STATUS" = "201" ] || [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ User registered successfully${NC}"
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
        echo -e "${GREEN}✓ Login successful${NC}"
        echo -e "${CYAN}Access Token:${NC} ${ACCESS_TOKEN:0:20}..."
    else
        echo -e "${RED}✗ Login failed${NC}"
    fi
    echo ""
}

##############################################################################
# NOTIFICATION MODULE TESTS
##############################################################################

test_notification_module() {
    print_module "NOTIFICATION MODULE (13 endpoints)"

    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"

    # 1. GET /notifications
    print_test "GET /notifications - Get user notifications"
    RESPONSE=$(api_request "GET" "/notifications?page=1&limit=10" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get user notifications" "GET" "/notifications" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    if [ "$STATUS" = "200" ]; then
        NOTIFICATION_ID=$(extract_json_value "$BODY" "id")
    fi

    if [ -z "$NOTIFICATION_ID" ]; then
        NOTIFICATION_ID=$FAKE_UUID
    fi

    # 2. GET /notifications/summary
    print_test "GET /notifications/summary - Get notification summary"
    RESPONSE=$(api_request "GET" "/notifications/summary" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get notification summary" "GET" "/notifications/summary" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 3. PUT /notifications/:id/read
    print_test "PUT /notifications/:id/read - Mark notification as read"
    RESPONSE=$(api_request "PUT" "/notifications/$NOTIFICATION_ID/read" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Mark notification as read" "PUT" "/notifications/:id/read" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 4. PUT /notifications/read-multiple
    print_test "PUT /notifications/read-multiple - Mark multiple as read"
    RESPONSE=$(api_request "PUT" "/notifications/read-multiple" '{
        "notificationIds": ["'"$NOTIFICATION_ID"'"]
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Mark multiple as read" "PUT" "/notifications/read-multiple" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 5. PUT /notifications/read-all
    print_test "PUT /notifications/read-all - Mark all as read"
    RESPONSE=$(api_request "PUT" "/notifications/read-all" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Mark all as read" "PUT" "/notifications/read-all" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 6. DELETE /notifications/:id
    print_test "DELETE /notifications/:id - Delete notification"
    RESPONSE=$(api_request "DELETE" "/notifications/$NOTIFICATION_ID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Delete notification" "DELETE" "/notifications/:id" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 7. GET /notifications/preferences
    print_test "GET /notifications/preferences - Get notification preferences"
    RESPONSE=$(api_request "GET" "/notifications/preferences" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get notification preferences" "GET" "/notifications/preferences" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 8. PUT /notifications/preferences
    print_test "PUT /notifications/preferences - Update notification preferences"
    RESPONSE=$(api_request "PUT" "/notifications/preferences" '{
        "emailNotifications": true,
        "smsNotifications": false,
        "pushNotifications": true
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Update notification preferences" "PUT" "/notifications/preferences" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 9. POST /notifications/admin/maintenance (Admin only)
    print_test "POST /notifications/admin/maintenance - Send maintenance notification (Admin required)"
    RESPONSE=$(api_request "POST" "/notifications/admin/maintenance" '{
        "title": "Test Maintenance",
        "message": "This is a test maintenance notification from API tests"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Send maintenance notification" "POST" "/notifications/admin/maintenance" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 10. POST /notifications/admin/security-alert (Admin only)
    print_test "POST /notifications/admin/security-alert - Send security alert (Admin required)"
    RESPONSE=$(api_request "POST" "/notifications/admin/security-alert" '{
        "eventType": "Test Security Event",
        "details": {"test": "data"},
        "severity": "LOW"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Send security alert" "POST" "/notifications/admin/security-alert" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 11. GET /notifications/admin/stats (Admin only)
    print_test "GET /notifications/admin/stats - Get notification stats (Admin required)"
    RESPONSE=$(api_request "GET" "/notifications/admin/stats" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get notification stats" "GET" "/notifications/admin/stats" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")
}

##############################################################################
# REPORT MODULE TESTS
##############################################################################

test_report_module() {
    print_module "REPORT MODULE (14 endpoints)"

    FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"
    START_DATE=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)
    END_DATE=$(date +%Y-%m-%d)

    # 1. GET /reports/election/:electionId (Admin only)
    print_test "GET /reports/election/:electionId - Generate election report (Admin required)"
    RESPONSE=$(api_request "GET" "/reports/election/$FAKE_UUID?format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate election report" "GET" "/reports/election/:electionId" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 2. GET /reports/system (Admin only)
    print_test "GET /reports/system - Generate system report (Admin required)"
    RESPONSE=$(api_request "GET" "/reports/system?startDate=${START_DATE}&endDate=${END_DATE}&format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate system report" "GET" "/reports/system" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 3. GET /reports/candidate/:candidateId
    print_test "GET /reports/candidate/:candidateId - Generate candidate report"
    RESPONSE=$(api_request "GET" "/reports/candidate/$FAKE_UUID?format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate candidate report" "GET" "/reports/candidate/:candidateId" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 4. GET /reports/voter/:voterId
    print_test "GET /reports/voter/:voterId - Generate voter report"
    RESPONSE=$(api_request "GET" "/reports/voter/$FAKE_UUID?format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate voter report" "GET" "/reports/voter/:voterId" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 5. GET /reports/audit (Admin only)
    print_test "GET /reports/audit - Generate audit report (Admin required)"
    RESPONSE=$(api_request "GET" "/reports/audit?startDate=${START_DATE}&endDate=${END_DATE}&format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate audit report" "GET" "/reports/audit" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 6. POST /reports/comparative (Admin only)
    print_test "POST /reports/comparative - Generate comparative report (Admin required)"
    RESPONSE=$(api_request "POST" "/reports/comparative" '{
        "electionIds": ["'"$FAKE_UUID"'", "'"$FAKE_UUID"'"],
        "format": "json"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Generate comparative report" "POST" "/reports/comparative" "$STATUS" "$BODY" "200/403/400" $([ "$STATUS" = "403" ] || [ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 7. POST /reports/schedule (Admin only)
    print_test "POST /reports/schedule - Schedule automated report (Admin required)"
    RESPONSE=$(api_request "POST" "/reports/schedule" '{
        "name": "Test Scheduled Report",
        "type": "system",
        "schedule": {
            "frequency": "weekly",
            "recipients": ["admin@jkuat.ac.ke"],
            "format": "pdf"
        }
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Schedule automated report" "POST" "/reports/schedule" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 8. GET /reports/templates (Admin only)
    print_test "GET /reports/templates - Get report templates (Admin required)"
    RESPONSE=$(api_request "GET" "/reports/templates" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get report templates" "GET" "/reports/templates" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 9. GET /reports/status/:reportId (Admin only)
    print_test "GET /reports/status/:reportId - Get report status (Admin required)"
    RESPONSE=$(api_request "GET" "/reports/status/$FAKE_UUID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get report status" "GET" "/reports/status/:reportId" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 10. GET /reports/download/:reportId
    print_test "GET /reports/download/:reportId - Download report"
    RESPONSE=$(api_request "GET" "/reports/download/$FAKE_UUID" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Download report" "GET" "/reports/download/:reportId" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 11. DELETE /reports/scheduled/:templateId (Admin only)
    print_test "DELETE /reports/scheduled/:templateId - Delete scheduled report (Admin required)"
    RESPONSE=$(api_request "DELETE" "/reports/scheduled/test-template" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Delete scheduled report" "DELETE" "/reports/scheduled/:templateId" "$STATUS" "$BODY" "200/403/404" $([ "$STATUS" = "403" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 12. GET /reports/analytics (Admin only)
    print_test "GET /reports/analytics - Get report analytics (Admin required)"
    RESPONSE=$(api_request "GET" "/reports/analytics?startDate=${START_DATE}&endDate=${END_DATE}" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get report analytics" "GET" "/reports/analytics" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 13. GET /reports/my-reports
    print_test "GET /reports/my-reports - Get user's accessible reports"
    RESPONSE=$(api_request "GET" "/reports/my-reports?type=voter&format=json" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get user's accessible reports" "GET" "/reports/my-reports" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 14. POST /reports/bulk-generate (Admin only)
    print_test "POST /reports/bulk-generate - Bulk generate reports (Admin required)"
    RESPONSE=$(api_request "POST" "/reports/bulk-generate" '{
        "reports": [
            {"type": "system", "format": "json"}
        ],
        "format": "json",
        "compress": true
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Bulk generate reports" "POST" "/reports/bulk-generate" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")
}

##############################################################################
# FILE MODULE TESTS
##############################################################################

test_file_module() {
    print_module "FILE MODULE (13 endpoints)"

    # 1. POST /files/upload/profile-image
    print_test "POST /files/upload/profile-image - Upload profile image (no file)"
    RESPONSE=$(api_request "POST" "/files/upload/profile-image" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Upload profile image" "POST" "/files/upload/profile-image" "$STATUS" "$BODY" "400" $([ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 2. POST /files/upload/candidate-photo
    print_test "POST /files/upload/candidate-photo - Upload candidate photo (no file)"
    RESPONSE=$(api_request "POST" "/files/upload/candidate-photo" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Upload candidate photo" "POST" "/files/upload/candidate-photo" "$STATUS" "$BODY" "400" $([ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 3. POST /files/upload/manifesto
    print_test "POST /files/upload/manifesto - Upload manifesto (no file)"
    RESPONSE=$(api_request "POST" "/files/upload/manifesto" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Upload manifesto" "POST" "/files/upload/manifesto" "$STATUS" "$BODY" "400" $([ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 4. POST /files/upload/banner-image (Admin only)
    print_test "POST /files/upload/banner-image - Upload banner image (Admin required)"
    RESPONSE=$(api_request "POST" "/files/upload/banner-image" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Upload banner image" "POST" "/files/upload/banner-image" "$STATUS" "$BODY" "400/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 5. POST /files/upload/document (Admin only)
    print_test "POST /files/upload/document - Upload document (Admin required)"
    RESPONSE=$(api_request "POST" "/files/upload/document" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Upload document" "POST" "/files/upload/document" "$STATUS" "$BODY" "400/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 6. POST /files/upload/bulk (Admin only)
    print_test "POST /files/upload/bulk - Bulk upload files (Admin required)"
    RESPONSE=$(api_request "POST" "/files/upload/bulk" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Bulk upload files" "POST" "/files/upload/bulk" "$STATUS" "$BODY" "400/403" $([ "$STATUS" = "403" ] || [ "$STATUS" = "400" ] && echo "true" || echo "false")

    # 7. DELETE /files/:filePath
    print_test "DELETE /files/:filePath - Delete file"
    RESPONSE=$(api_request "DELETE" "/files/test/file.jpg" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Delete file" "DELETE" "/files/:filePath" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 8. GET /files/info/:filePath
    print_test "GET /files/info/:filePath - Get file info"
    RESPONSE=$(api_request "GET" "/files/info/test/file.jpg" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get file info" "GET" "/files/info/:filePath" "$STATUS" "$BODY" "200/404" $([ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] && echo "true" || echo "false")

    # 9. POST /files/cleanup/temp (Admin only)
    print_test "POST /files/cleanup/temp - Cleanup temp files (Admin required)"
    RESPONSE=$(api_request "POST" "/files/cleanup/temp" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Cleanup temp files" "POST" "/files/cleanup/temp" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 10. GET /files/configs
    print_test "GET /files/configs - Get upload configurations"
    RESPONSE=$(api_request "GET" "/files/configs" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get upload configurations" "GET" "/files/configs" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 11. GET /files/health (Admin only)
    print_test "GET /files/health - Check file service health (Admin required)"
    RESPONSE=$(api_request "GET" "/files/health" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Check file service health" "GET" "/files/health" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")

    # 12. POST /files/validate
    print_test "POST /files/validate - Validate file before upload"
    RESPONSE=$(api_request "POST" "/files/validate" '{
        "fileName": "test-image.jpg",
        "fileSize": 500000,
        "mimeType": "image/jpeg",
        "uploadType": "profile"
    }' "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Validate file before upload" "POST" "/files/validate" "$STATUS" "$BODY" "200" $([ "$STATUS" = "200" ] && echo "true" || echo "false")

    # 13. GET /files/stats (Admin only)
    print_test "GET /files/stats - Get file statistics (Admin required)"
    RESPONSE=$(api_request "GET" "/files/stats" "" "$ACCESS_TOKEN")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    log_result "Get file statistics" "GET" "/files/stats" "$STATUS" "$BODY" "200/403" $([ "$STATUS" = "200" ] || [ "$STATUS" = "403" ] && echo "true" || echo "false")
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    print_header "STARTING API TESTS - MODULES: Notification, Report, File"

    echo -e "${CYAN}Base URL:${NC} $BASE_URL"
    echo -e "${CYAN}Results File:${NC} $RESULTS_FILE"
    echo ""

    # Setup
    setup_authentication

    # Run tests
    test_notification_module
    test_report_module
    test_file_module

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
  "modules_tested": ["notification", "report", "file"],
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
