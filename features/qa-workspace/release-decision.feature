@qa-workspace @releases
Feature: Release decision
  As a QA lead
  I want the release recommendation to be backed by evidence
  So that nobody can mark a build Ready while critical bugs are open

  Background:
    Given I open the QA Workspace release "rel-084"

  @p1 @smoke
  Scenario: TC-QW-010 Ready is unavailable while critical bugs are open
    Then the release shows "2 critical bugs unresolved"
    And the "Ready" recommendation is disabled with "Unavailable while critical bugs are unresolved."

  @p1
  Scenario: TC-QW-011 An accepted risk needs a rationale and an owner
    When I choose the "Ready with accepted risks" recommendation
    And I write the rationale "Risks are known and owned."
    And I save the decision
    Then saving is refused because an accepted risk is missing

  @p2
  Scenario: TC-QW-012 A decision needs a rationale
    When I choose the "Hold" recommendation
    And I write the rationale ""
    And I save the decision
    Then I see "Add a rationale so the decision can be understood later."
