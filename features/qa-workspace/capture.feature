@qa-workspace @capture
Feature: Capture a bug
  As a tester
  I want the bug form to validate what a developer needs
  So that no bug arrives without steps, expected and actual results

  Background:
    Given I open the QA Workspace capture page for a "Bug"

  @p1 @smoke
  Scenario: TC-QW-003 Required bug fields are reported inline
    When I try to submit the finding
    Then the fields "Title, Severity, Priority, Steps to reproduce, Expected result, Actual result" are marked invalid

  @p1
  Scenario: TC-QW-004 Severity and priority are stored independently
    When I fill a bug titled "Low severity, urgent fix" with severity "low" and priority "P1"
    And I submit the finding
    Then the finding appears in Triage with severity "Low" and priority "P1"
