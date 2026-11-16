@saucedemo @auth
Feature: Login
  As a shopper
  I want to sign in with my account
  So that I can see the products and buy them

  Background:
    Given I am on the Swag Labs login page

  @p1 @smoke
  Scenario: TC-SD-001 A valid user reaches the products page
    When I log in as "standard_user"
    Then I see the Products page

  @p1
  Scenario Outline: Login is refused with a clear message
    When I log in with username "<username>" and password "<password>"
    Then I see the login error "<message>"
    And I stay on the login page

    Examples:
      | case      | username        | password     | message                                                                   |
      | TC-SD-003 |                 |              | Epic sadface: Username is required                                        |
      | TC-SD-004 | standard_user   |              | Epic sadface: Password is required                                        |
      | TC-SD-005 | standard_user   | wrong        | Epic sadface: Username and password do not match any user in this service |
      | TC-SD-006 | locked_out_user | secret_sauce | Epic sadface: Sorry, this user has been locked out.                       |

  @p1 @fail
  Scenario: TC-SD-037 The next shopper does not inherit the previous cart (BUG-001)
    Given I log in as "standard_user"
    And I add "Sauce Labs Backpack" and "Sauce Labs Onesie" to the cart
    When I log out
    And I log in as "visual_user"
    Then the cart is empty
