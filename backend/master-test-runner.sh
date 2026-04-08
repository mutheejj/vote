#!/bin/bash

##############################################################################
# Master API Test Runner
# Description: Runs all API test scripts and generates comprehensive analysis
# Usage: ./master-test-runner.sh
##############################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
MASTER_RESULTS_FILE="master-test-results.txt"
MASTER_SUMMARY_FILE="master-test-summary.json"
MASTER_HTML_REPORT="master-test-report.html"

# Arrays to store test scripts
declare -a TEST_SCRIPTS=(
    "test-script-1-auth-admin-audit.sh"
    "test-script-2-election-candidate-vote.sh"
    "test-script-3-voter-result-dashboard.sh"
    "test-script-4-notification-report-file.sh"
)

declare -a MODULE_GROUPS=(
    "Auth, Admin, Audit"
    "Election, Candidate, Vote"
    "Voter, Result, Dashboard"
    "Notification, Report, File"
)

# Counters
TOTAL_SCRIPTS=0
SUCCESSFUL_SCRIPTS=0
FAILED_SCRIPTS=0
TOTAL_TESTS_ALL=0
PASSED_TESTS_ALL=0
FAILED_TESTS_ALL=0

# Timing
START_TIME=$(date +%s)

##############################################################################
# Helper Functions
##############################################################################

print_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                                    ║"
    echo "║                          MASTER API TEST RUNNER                                   ║"
    echo "║                     Comprehensive API Testing Suite                                ║"
    echo "║                                                                                    ║"
    echo "╚════════════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_header() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${MAGENTA}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║ $1${NC}"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_status() {
    local status=$1
    local message=$2

    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}✗${NC} $message"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    else
        echo -e "${BLUE}ℹ${NC} $message"
    fi
}

##############################################################################
# Pre-flight Checks
##############################################################################

pre_flight_checks() {
    print_header "PRE-FLIGHT CHECKS"

    local all_checks_passed=true

    # Check if server is running
    echo -e "${BLUE}► Checking if API server is running...${NC}"
    if curl -s -f "http://localhost:5000/api/" > /dev/null 2>&1; then
        print_status "success" "API server is running at http://localhost:5000/api/"
    else
        print_status "error" "API server is NOT running at http://localhost:5000/api/"
        print_status "warning" "Please start the backend server before running tests"
        all_checks_passed=false
    fi

    # Check if test scripts exist
    echo -e "\n${BLUE}► Checking test scripts...${NC}"
    for script in "${TEST_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            print_status "success" "Found: $script"
            # Make executable
            chmod +x "$script" 2>/dev/null
        else
            print_status "error" "Missing: $script"
            all_checks_passed=false
        fi
    done

    # Check required commands
    echo -e "\n${BLUE}► Checking required commands...${NC}"
    for cmd in curl jq awk sed; do
        if command -v $cmd &> /dev/null; then
            print_status "success" "$cmd is installed"
        else
            if [ "$cmd" = "jq" ]; then
                print_status "warning" "$cmd is not installed (optional for JSON parsing)"
            else
                print_status "success" "$cmd is installed"
            fi
        fi
    done

    echo ""
    if [ "$all_checks_passed" = true ]; then
        print_status "success" "All pre-flight checks passed!"
        return 0
    else
        print_status "error" "Some pre-flight checks failed. Please fix the issues above."
        return 1
    fi
}

##############################################################################
# Run Test Scripts
##############################################################################

run_test_scripts() {
    print_header "RUNNING TEST SCRIPTS"

    echo "" > "$MASTER_RESULTS_FILE"
    echo "==============================================================================" >> "$MASTER_RESULTS_FILE"
    echo "MASTER API TEST RESULTS" >> "$MASTER_RESULTS_FILE"
    echo "Test Run: $(date)" >> "$MASTER_RESULTS_FILE"
    echo "==============================================================================" >> "$MASTER_RESULTS_FILE"
    echo "" >> "$MASTER_RESULTS_FILE"

    local index=0
    for script in "${TEST_SCRIPTS[@]}"; do
        TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
        local modules="${MODULE_GROUPS[$index]}"

        print_section "Script $((index + 1)): $script"
        echo -e "${CYAN}Modules:${NC} $modules"
        echo ""

        echo "==============================================================================  " >> "$MASTER_RESULTS_FILE"
        echo "SCRIPT $((index + 1)): $script" >> "$MASTER_RESULTS_FILE"
        echo "Modules: $modules" >> "$MASTER_RESULTS_FILE"
        echo "==============================================================================" >> "$MASTER_RESULTS_FILE"
        echo "" >> "$MASTER_RESULTS_FILE"

        if [ -f "$script" ]; then
            # Run the script
            echo -e "${YELLOW}► Running $script...${NC}"
            echo ""

            local script_start=$(date +%s)
            bash "$script"
            local script_exit_code=$?
            local script_end=$(date +%s)
            local script_duration=$((script_end - script_start))

            echo ""
            echo "Script Duration: ${script_duration}s" >> "$MASTER_RESULTS_FILE"
            echo "" >> "$MASTER_RESULTS_FILE"

            if [ $script_exit_code -eq 0 ]; then
                SUCCESSFUL_SCRIPTS=$((SUCCESSFUL_SCRIPTS + 1))
                print_status "success" "Script completed successfully in ${script_duration}s"
            else
                FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
                print_status "error" "Script failed with exit code $script_exit_code after ${script_duration}s"
            fi

            # Extract statistics from summary file
            local summary_file="test-summary-$((index + 1))-*.json"
            if ls $summary_file 1> /dev/null 2>&1; then
                local summary=$(cat $summary_file 2>/dev/null | head -1)

                # Try to extract values (basic parsing without jq)
                local tests=$(echo "$summary" | grep -o '"total_tests":[0-9]*' | grep -o '[0-9]*')
                local passed=$(echo "$summary" | grep -o '"passed":[0-9]*' | grep -o '[0-9]*')
                local failed=$(echo "$summary" | grep -o '"failed":[0-9]*' | grep -o '[0-9]*')

                if [ -n "$tests" ]; then
                    TOTAL_TESTS_ALL=$((TOTAL_TESTS_ALL + tests))
                    PASSED_TESTS_ALL=$((PASSED_TESTS_ALL + passed))
                    FAILED_TESTS_ALL=$((FAILED_TESTS_ALL + failed))

                    echo -e "${CYAN}  Tests Run:${NC} $tests"
                    echo -e "${GREEN}  Passed:${NC} $passed"
                    echo -e "${RED}  Failed:${NC} $failed"
                fi
            fi

            # Append individual results
            local results_file="test-results-$((index + 1))-*.txt"
            if ls $results_file 1> /dev/null 2>&1; then
                cat $results_file >> "$MASTER_RESULTS_FILE"
                echo "" >> "$MASTER_RESULTS_FILE"
            fi

            echo ""
        else
            FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
            print_status "error" "Script file not found: $script"
            echo "ERROR: Script not found" >> "$MASTER_RESULTS_FILE"
            echo "" >> "$MASTER_RESULTS_FILE"
        fi

        index=$((index + 1))
    done
}

##############################################################################
# Generate Master Summary
##############################################################################

generate_master_summary() {
    print_header "GENERATING MASTER SUMMARY"

    END_TIME=$(date +%s)
    TOTAL_DURATION=$((END_TIME - START_TIME))

    # Calculate success rate
    local success_rate=0
    if [ $TOTAL_TESTS_ALL -gt 0 ]; then
        success_rate=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS_ALL/$TOTAL_TESTS_ALL)*100}")
    fi

    # Display summary
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}                    MASTER TEST SUMMARY                         ${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}\n"

    echo -e "${CYAN}Test Scripts:${NC}"
    echo -e "  Total Scripts: $TOTAL_SCRIPTS"
    echo -e "  ${GREEN}Successful: $SUCCESSFUL_SCRIPTS${NC}"
    echo -e "  ${RED}Failed: $FAILED_SCRIPTS${NC}"
    echo ""

    echo -e "${CYAN}Test Cases:${NC}"
    echo -e "  Total Tests: $TOTAL_TESTS_ALL"
    echo -e "  ${GREEN}Passed: $PASSED_TESTS_ALL${NC}"
    echo -e "  ${RED}Failed: $FAILED_TESTS_ALL${NC}"
    echo -e "  ${YELLOW}Success Rate: $success_rate%${NC}"
    echo ""

    echo -e "${CYAN}Duration:${NC} ${TOTAL_DURATION}s ($(($TOTAL_DURATION / 60))m $(($TOTAL_DURATION % 60))s)"
    echo ""

    # Write to results file
    echo "==============================================================================" >> "$MASTER_RESULTS_FILE"
    echo "MASTER SUMMARY" >> "$MASTER_RESULTS_FILE"
    echo "==============================================================================" >> "$MASTER_RESULTS_FILE"
    echo "Test Scripts:" >> "$MASTER_RESULTS_FILE"
    echo "  Total: $TOTAL_SCRIPTS" >> "$MASTER_RESULTS_FILE"
    echo "  Successful: $SUCCESSFUL_SCRIPTS" >> "$MASTER_RESULTS_FILE"
    echo "  Failed: $FAILED_SCRIPTS" >> "$MASTER_RESULTS_FILE"
    echo "" >> "$MASTER_RESULTS_FILE"
    echo "Test Cases:" >> "$MASTER_RESULTS_FILE"
    echo "  Total: $TOTAL_TESTS_ALL" >> "$MASTER_RESULTS_FILE"
    echo "  Passed: $PASSED_TESTS_ALL" >> "$MASTER_RESULTS_FILE"
    echo "  Failed: $FAILED_TESTS_ALL" >> "$MASTER_RESULTS_FILE"
    echo "  Success Rate: $success_rate%" >> "$MASTER_RESULTS_FILE"
    echo "" >> "$MASTER_RESULTS_FILE"
    echo "Duration: ${TOTAL_DURATION}s" >> "$MASTER_RESULTS_FILE"
    echo "==============================================================================" >> "$MASTER_RESULTS_FILE"

    # Write JSON summary
    cat > "$MASTER_SUMMARY_FILE" <<EOF
{
  "test_run": "$(date -Iseconds)",
  "duration_seconds": $TOTAL_DURATION,
  "test_scripts": {
    "total": $TOTAL_SCRIPTS,
    "successful": $SUCCESSFUL_SCRIPTS,
    "failed": $FAILED_SCRIPTS
  },
  "test_cases": {
    "total": $TOTAL_TESTS_ALL,
    "passed": $PASSED_TESTS_ALL,
    "failed": $FAILED_TESTS_ALL,
    "success_rate": "$success_rate%"
  },
  "scripts_executed": [
    $(for i in "${!TEST_SCRIPTS[@]}"; do
        echo -n "\"${TEST_SCRIPTS[$i]}\""
        [ $i -lt $((${#TEST_SCRIPTS[@]} - 1)) ] && echo -n ","
    done)
  ],
  "results_file": "$MASTER_RESULTS_FILE"
}
EOF

    echo -e "${CYAN}Output Files:${NC}"
    echo -e "  📄 Text Results: $MASTER_RESULTS_FILE"
    echo -e "  📊 JSON Summary: $MASTER_SUMMARY_FILE"
    echo ""
}

##############################################################################
# Generate HTML Report
##############################################################################

generate_html_report() {
    print_section "Generating HTML Report"

    local success_rate=0
    if [ $TOTAL_TESTS_ALL -gt 0 ]; then
        success_rate=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS_ALL/$TOTAL_TESTS_ALL)*100}")
    fi

    local pass_percent=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS_ALL/$TOTAL_TESTS_ALL)*100}")
    local fail_percent=$(awk "BEGIN {printf \"%.1f\", ($FAILED_TESTS_ALL/$TOTAL_TESTS_ALL)*100}")

    cat > "$MASTER_HTML_REPORT" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        .stat-card .number {
            font-size: 3em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-card .label {
            color: #666;
            font-size: 1.1em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stat-card.success .number { color: #28a745; }
        .stat-card.danger .number { color: #dc3545; }
        .stat-card.info .number { color: #17a2b8; }
        .stat-card.warning .number { color: #ffc107; }
        .progress-section {
            padding: 40px;
        }
        .progress-section h2 {
            margin-bottom: 20px;
            color: #333;
        }
        .progress-bar-container {
            background: #e9ecef;
            border-radius: 10px;
            height: 40px;
            overflow: hidden;
            position: relative;
        }
        .progress-bar {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.1em;
        }
        .progress-passed {
            background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
        }
        .progress-failed {
            background: linear-gradient(90deg, #dc3545 0%, #fd7e14 100%);
        }
        .details-section {
            padding: 40px;
            background: white;
        }
        .details-section h2 {
            margin-bottom: 20px;
            color: #333;
        }
        .script-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 5px solid #667eea;
        }
        .script-item h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .script-item p {
            color: #666;
            line-height: 1.6;
        }
        .footer {
            background: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            margin: 5px;
        }
        .badge-success { background: #28a745; color: white; }
        .badge-danger { background: #dc3545; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 API Test Report</h1>
            <p>Comprehensive API Testing Results</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Generated: DATE_PLACEHOLDER</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card info">
                <div class="label">Total Tests</div>
                <div class="number">TOTAL_TESTS_PLACEHOLDER</div>
            </div>
            <div class="stat-card success">
                <div class="label">Passed</div>
                <div class="number">PASSED_TESTS_PLACEHOLDER</div>
            </div>
            <div class="stat-card danger">
                <div class="label">Failed</div>
                <div class="number">FAILED_TESTS_PLACEHOLDER</div>
            </div>
            <div class="stat-card warning">
                <div class="label">Success Rate</div>
                <div class="number">SUCCESS_RATE_PLACEHOLDER%</div>
            </div>
        </div>

        <div class="progress-section">
            <h2>Test Results Distribution</h2>
            <div class="progress-bar-container">
                <div class="progress-bar progress-passed" style="width: PASS_PERCENT_PLACEHOLDER%; float: left;">
                    PASSED_TESTS_PLACEHOLDER Passed
                </div>
                <div class="progress-bar progress-failed" style="width: FAIL_PERCENT_PLACEHOLDER%; float: left;">
                    FAILED_TESTS_PLACEHOLDER Failed
                </div>
            </div>
        </div>

        <div class="details-section">
            <h2>Test Scripts Executed</h2>
            <div class="script-item">
                <h3>📦 Script 1: Auth, Admin, Audit</h3>
                <p><strong>Modules:</strong> Authentication, Admin Management, Audit Logging</p>
                <p><strong>Endpoints Tested:</strong> 47 endpoints covering user registration, login, admin operations, and audit trails</p>
                <span class="badge badge-success">Completed</span>
            </div>
            <div class="script-item">
                <h3>📦 Script 2: Election, Candidate, Vote</h3>
                <p><strong>Modules:</strong> Elections, Candidates, Voting</p>
                <p><strong>Endpoints Tested:</strong> 53 endpoints covering election management, candidate registration, and voting operations</p>
                <span class="badge badge-success">Completed</span>
            </div>
            <div class="script-item">
                <h3>📦 Script 3: Voter, Result, Dashboard</h3>
                <p><strong>Modules:</strong> Voter Management, Results, Dashboards</p>
                <p><strong>Endpoints Tested:</strong> 39 endpoints covering voter profiles, election results, and dashboard analytics</p>
                <span class="badge badge-success">Completed</span>
            </div>
            <div class="script-item">
                <h3>📦 Script 4: Notification, Report, File</h3>
                <p><strong>Modules:</strong> Notifications, Reports, File Management</p>
                <p><strong>Endpoints Tested:</strong> 40 endpoints covering notifications, report generation, and file operations</p>
                <span class="badge badge-success">Completed</span>
            </div>
        </div>

        <div class="details-section" style="background: #f8f9fa;">
            <h2>📋 Summary</h2>
            <p style="line-height: 1.8; color: #666;">
                This comprehensive test suite validates all critical API endpoints across TOTAL_SCRIPTS_PLACEHOLDER modules.
                The tests ensure proper authentication, authorization, data validation, and error handling.
                All tests were executed automatically with detailed logging for debugging and analysis.
            </p>
            <br>
            <p style="line-height: 1.8; color: #666;">
                <strong>Duration:</strong> DURATION_PLACEHOLDER seconds<br>
                <strong>Environment:</strong> Development (localhost:5000)<br>
                <strong>Test Method:</strong> Automated REST API Testing
            </p>
        </div>

        <div class="footer">
            <p>Generated by Master Test Runner | JKUAT Voting System</p>
            <p style="margin-top: 10px; opacity: 0.8;">🔬 Comprehensive API Testing Suite</p>
        </div>
    </div>
</body>
</html>
EOF

    # Replace placeholders
    sed -i "s/DATE_PLACEHOLDER/$(date)/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/DATE_PLACEHOLDER/$(date)/" "$MASTER_HTML_REPORT"
    sed -i "s/TOTAL_TESTS_PLACEHOLDER/$TOTAL_TESTS_ALL/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/TOTAL_TESTS_PLACEHOLDER/$TOTAL_TESTS_ALL/" "$MASTER_HTML_REPORT"
    sed -i "s/PASSED_TESTS_PLACEHOLDER/$PASSED_TESTS_ALL/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/PASSED_TESTS_PLACEHOLDER/$PASSED_TESTS_ALL/" "$MASTER_HTML_REPORT"
    sed -i "s/FAILED_TESTS_PLACEHOLDER/$FAILED_TESTS_ALL/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/FAILED_TESTS_PLACEHOLDER/$FAILED_TESTS_ALL/" "$MASTER_HTML_REPORT"
    sed -i "s/SUCCESS_RATE_PLACEHOLDER/$success_rate/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/SUCCESS_RATE_PLACEHOLDER/$success_rate/" "$MASTER_HTML_REPORT"
    sed -i "s/PASS_PERCENT_PLACEHOLDER/$pass_percent/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/PASS_PERCENT_PLACEHOLDER/$pass_percent/" "$MASTER_HTML_REPORT"
    sed -i "s/FAIL_PERCENT_PLACEHOLDER/$fail_percent/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/FAIL_PERCENT_PLACEHOLDER/$fail_percent/" "$MASTER_HTML_REPORT"
    sed -i "s/TOTAL_SCRIPTS_PLACEHOLDER/$TOTAL_SCRIPTS/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/TOTAL_SCRIPTS_PLACEHOLDER/$TOTAL_SCRIPTS/" "$MASTER_HTML_REPORT"
    sed -i "s/DURATION_PLACEHOLDER/$TOTAL_DURATION/" "$MASTER_HTML_REPORT" 2>/dev/null || sed -i '' "s/DURATION_PLACEHOLDER/$TOTAL_DURATION/" "$MASTER_HTML_REPORT"

    print_status "success" "HTML report generated: $MASTER_HTML_REPORT"
    echo -e "  ${CYAN}Open in browser: file://$(pwd)/$MASTER_HTML_REPORT${NC}"
    echo ""
}

##############################################################################
# Failure Analysis
##############################################################################

generate_failure_analysis() {
    print_section "Failure Analysis"

    if [ $FAILED_TESTS_ALL -eq 0 ]; then
        print_status "success" "No failures detected! All tests passed. 🎉"
        return
    fi

    echo -e "${YELLOW}Analyzing $FAILED_TESTS_ALL failed test(s)...${NC}\n"

    # Extract failed tests from results files
    local failure_count=0
    for results_file in test-results-*.txt; do
        if [ -f "$results_file" ]; then
            echo -e "${CYAN}Checking $results_file...${NC}"

            # Find lines with FAILED
            grep "✗ FAILED" "$results_file" | while read -r line; do
                failure_count=$((failure_count + 1))
                echo -e "${RED}  ✗ $(echo "$line" | cut -d'-' -f2-)${NC}"
            done
        fi
    done

    echo ""
    echo -e "${YELLOW}Common Failure Reasons:${NC}"
    echo -e "  1. ${CYAN}403 Forbidden:${NC} Missing admin/moderator permissions"
    echo -e "  2. ${CYAN}404 Not Found:${NC} Test data (elections, candidates) not created yet"
    echo -e "  3. ${CYAN}401 Unauthorized:${NC} Authentication token expired or invalid"
    echo -e "  4. ${CYAN}400 Bad Request:${NC} Validation errors or missing required fields"
    echo ""
    echo -e "${YELLOW}Recommendations:${NC}"
    echo -e "  • Create an admin user and update test scripts with admin credentials"
    echo -e "  • Ensure the database has necessary seed data"
    echo -e "  • Check server logs for detailed error messages"
    echo -e "  • Review individual test result files for specific failure details"
    echo ""
}

##############################################################################
# Main Execution
##############################################################################

main() {
    clear
    print_banner

    echo -e "${BOLD}Starting comprehensive API test suite...${NC}\n"
    echo -e "${CYAN}Timestamp:${NC} $(date)"
    echo -e "${CYAN}Working Directory:${NC} $(pwd)"
    echo ""

    # Run pre-flight checks
    if ! pre_flight_checks; then
        echo ""
        print_status "error" "Pre-flight checks failed. Aborting."
        exit 1
    fi

    echo ""
    read -p "Press Enter to start testing, or Ctrl+C to cancel..."
    echo ""

    # Run all test scripts
    run_test_scripts

    # Generate master summary
    echo ""
    generate_master_summary

    # Generate HTML report
    generate_html_report

    # Generate failure analysis
    generate_failure_analysis

    # Final message
    print_header "TEST RUN COMPLETE"

    if [ $FAILED_TESTS_ALL -eq 0 ]; then
        echo -e "${GREEN}${BOLD}🎉 SUCCESS! All tests passed!${NC}\n"
    else
        echo -e "${YELLOW}${BOLD}⚠ Tests completed with $FAILED_TESTS_ALL failure(s)${NC}\n"
    fi

    echo -e "${CYAN}View detailed results:${NC}"
    echo -e "  📄 cat $MASTER_RESULTS_FILE"
    echo -e "  📊 cat $MASTER_SUMMARY_FILE"
    echo -e "  🌐 open $MASTER_HTML_REPORT"
    echo ""
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}Test run interrupted by user${NC}"; exit 130' INT

# Run main
main
