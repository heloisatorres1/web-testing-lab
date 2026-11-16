@saucedemo @checkout
Feature: Checkout
  As a shopper
  I want to pay for the items in my cart
  So that my order is placed with the correct total

  Background:
    Given I am on the Swag Labs login page
    And I log in as "standard_user"

  @p1 @smoke
  Scenario: TC-SD-022 A shopper completes a purchase
    Given I add "Sauce Labs Backpack" and "Sauce Labs Bike Light" to the cart
    When I check out as "Ana" "Silva" with postal code "86000-000"
    Then the overview shows an item total of $39.98, tax of $3.20 and a total of $43.18
    When I finish the order
    Then I see "Thank you for your order!"
    And the cart is empty

  @p1
  Scenario: TC-SD-015 Adding an item updates the cart badge
    When I add "Sauce Labs Backpack" to the cart
    Then the cart badge shows 1

  @p1
  Scenario Outline: TC-SD-023 Checkout reports the first missing field
    Given I add "Sauce Labs Backpack" to the cart
    When I check out as "<first>" "<last>" with postal code "<postal>"
    Then I see the checkout error "<message>"

    Examples:
      | first | last  | postal | message                        |
      |       | Silva | 86000  | Error: First Name is required  |
      | Ana   |       | 86000  | Error: Last Name is required   |
      | Ana   | Silva |        | Error: Postal Code is required |

  @p2
  Scenario Outline: TC-SD-013 Products can be sorted
    When I sort the products by "<option>"
    Then the products are ordered by <order>

    Examples:
      | option              | order              |
      | Name (Z to A)       | name descending    |
      | Price (low to high) | price ascending    |
      | Price (high to low) | price descending   |
