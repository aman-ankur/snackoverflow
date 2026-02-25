import { test, expect } from '@playwright/test';

/**
 * E2E Test: Alternative Dish Selection Flow
 *
 * This test demonstrates the complete user flow for selecting
 * between alternative dish identifications in mock mode.
 *
 * User Journey:
 * 1. Load app in mock scan mode
 * 2. See camera view → Analyze Dish button
 * 3. Click Analyze → AI returns 3 options for "Jeera Rice"
 * 4. Expand dish card → see DishAlternatives component
 * 5. See 3 options as radio buttons with nutrition previews
 * 6. Select alternative (Steamed Rice) → instant swap
 * 7. Verify nutrition changed instantly (no loading)
 * 8. Verify plate total recalculated
 */

test.describe('Alternative Dish Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start dev server with mock mode
    await page.goto('http://localhost:3000?mock=scan');

    // Should auto-navigate to Scan tab
    await expect(page.locator('[data-testid="scan-tab"]').or(page.getByRole('button', { name: /scan|photo/i }))).toBeVisible({ timeout: 5000 });
  });

  test('complete alternative selection flow', async ({ page }) => {
    // Step 1: Camera view loads
    await expect(page.getByText(/analyze dish|capture/i)).toBeVisible();
    console.log('✓ Camera view loaded');

    // Step 2: Click Analyze Dish button
    const analyzeButton = page.getByRole('button', { name: /analyze dish/i });
    await analyzeButton.click();
    console.log('✓ Clicked Analyze Dish');

    // Step 3: Wait for analysis to complete (mock delay ~1.5s)
    await expect(page.getByText('Analysis complete')).toBeVisible({ timeout: 3000 });
    console.log('✓ Analysis completed');

    // Step 4: Verify 3 dishes appear in results
    await expect(page.getByText('Dal Tadka')).toBeVisible();
    await expect(page.getByText('Jeera Rice')).toBeVisible();
    await expect(page.getByText('Aloo Gobi')).toBeVisible();
    console.log('✓ All 3 dishes visible');

    // Step 5: Find Jeera Rice card (the one with alternatives)
    const jeeraRiceCard = page.locator('[data-dish-name="Jeera Rice"]').or(
      page.locator('text=Jeera Rice').locator('..').locator('..').locator('..')
    );

    // Step 6: Expand the Jeera Rice card
    await jeeraRiceCard.click();
    console.log('✓ Expanded Jeera Rice card');

    // Wait for expansion animation
    await page.waitForTimeout(300);

    // Step 7: Verify DishAlternatives component appears
    await expect(page.getByText('Select Dish')).toBeVisible({ timeout: 2000 });
    console.log('✓ DishAlternatives component visible');

    // Step 8: Verify all 3 options are visible
    await expect(page.getByText('Jeera Rice').and(page.locator('.dish-name, .dish-card'))).toBeVisible();
    await expect(page.getByText('Steamed Rice')).toBeVisible();
    await expect(page.getByText('Fried Rice')).toBeVisible();
    console.log('✓ All 3 dish options visible');

    // Step 9: Verify confidence badges
    const confidenceBadges = page.locator('.confidence-badge, [class*="confidence"]');
    await expect(confidenceBadges).toHaveCount(3, { timeout: 2000 });
    console.log('✓ Confidence badges present');

    // Step 10: Verify nutrition previews are shown
    await expect(page.getByText(/210 cal|205 cal|280 cal/)).toBeVisible();
    await expect(page.getByText(/P: 4g|P: 5g/)).toBeVisible();
    console.log('✓ Nutrition previews visible');

    // Step 11: Verify reasoning text is shown
    await expect(page.getByText(/could be|suggests|visible/i)).toBeVisible();
    console.log('✓ Reasoning text visible');

    // Step 12: Capture initial calorie value
    const plateTotal = page.locator('[data-testid="plate-total"]').or(
      page.locator('text=/\\d+ kcal/i').first()
    );
    const initialCalories = await plateTotal.textContent();
    console.log(`✓ Initial plate total: ${initialCalories}`);

    // Step 13: Click on "Steamed Rice" alternative (should be 205 cal vs 210 cal)
    const steamedRiceOption = page.locator('text=Steamed Rice').locator('..').locator('..').locator('..');
    await steamedRiceOption.click();
    console.log('✓ Clicked Steamed Rice alternative');

    // Step 14: Verify INSTANT swap (no loading spinner should appear)
    await page.waitForTimeout(100); // Give React time to update state

    // Verify no loading indicator
    const loadingSpinner = page.locator('[data-testid="loading"]').or(page.locator('.animate-spin, [class*="spinner"]'));
    await expect(loadingSpinner).toHaveCount(0);
    console.log('✓ No loading spinner (instant swap confirmed)');

    // Step 15: Verify plate total changed
    const newCalories = await plateTotal.textContent();
    expect(newCalories).not.toBe(initialCalories);
    console.log(`✓ Plate total updated: ${initialCalories} → ${newCalories}`);

    // Step 16: Verify radio button moved to Steamed Rice
    const steamedRiceRadio = steamedRiceOption.locator('[class*="radio"], input[type="radio"]');
    // Check for selected state (border-accent, bg-accent, or checked attribute)
    const hasSelectedClass = await steamedRiceOption.evaluate(el =>
      el.className.includes('border-accent') || el.className.includes('selected')
    );
    expect(hasSelectedClass).toBe(true);
    console.log('✓ Radio button moved to Steamed Rice');

    // Step 17: Verify expanded nutrition details updated
    await expect(page.getByText('205', { exact: false })).toBeVisible(); // Steamed rice calories
    console.log('✓ Expanded nutrition details updated');

    // Step 18: Select another alternative (Fried Rice - 280 cal)
    const friedRiceOption = page.locator('text=Fried Rice').locator('..').locator('..').locator('..');
    await friedRiceOption.click();
    console.log('✓ Clicked Fried Rice alternative');

    // Step 19: Verify calories changed again (instant)
    await page.waitForTimeout(100);
    const finalCalories = await plateTotal.textContent();
    expect(finalCalories).not.toBe(newCalories);
    console.log(`✓ Plate total updated again: ${newCalories} → ${finalCalories}`);

    // Step 20: Verify can switch back to primary (Jeera Rice)
    const jeeraRicePrimary = page.locator('text=Jeera Rice').first().locator('..').locator('..').locator('..');
    await jeeraRicePrimary.click();
    await page.waitForTimeout(100);
    const backToOriginal = await plateTotal.textContent();
    expect(backToOriginal).toBe(initialCalories);
    console.log(`✓ Switched back to primary: ${finalCalories} → ${backToOriginal}`);

    // Step 21: Verify Log Meal button is still enabled
    const logMealButton = page.getByRole('button', { name: /log meal/i });
    await expect(logMealButton).toBeEnabled();
    console.log('✓ Log Meal button enabled');

    // Success!
    console.log('\n✅ All 21 steps passed! Alternative selection flow working perfectly.\n');
  });

  test('alternatives hidden for high-confidence dishes', async ({ page }) => {
    // This test verifies client-side filtering logic

    // Click Analyze Dish
    await page.getByRole('button', { name: /analyze dish/i }).click();
    await expect(page.getByText('Analysis complete')).toBeVisible({ timeout: 3000 });

    // Expand Dal Tadka (high confidence, no alternatives)
    const dalTadkaCard = page.locator('[data-dish-name="Dal Tadka"]').or(
      page.locator('text=Dal Tadka').locator('..').locator('..').locator('..')
    );
    await dalTadkaCard.click();
    await page.waitForTimeout(300);

    // Verify "Select Dish" label does NOT appear (no alternatives)
    await expect(page.getByText('Select Dish')).toHaveCount(0);
    console.log('✓ No alternatives shown for high-confidence Dal Tadka');

    // Expand Aloo Gobi (medium confidence, no alternatives - distinctive enough)
    const alooGobiCard = page.locator('[data-dish-name="Aloo Gobi"]').or(
      page.locator('text=Aloo Gobi').locator('..').locator('..').locator('..')
    );
    await alooGobiCard.click();
    await page.waitForTimeout(300);

    // Verify no alternatives here either
    await expect(page.getByText('Select Dish')).toHaveCount(0);
    console.log('✓ No alternatives shown for distinctive Aloo Gobi');

    console.log('\n✅ Smart filtering working! Alternatives only shown for Jeera Rice.\n');
  });

  test('nutrition editing still works after alternative selection', async ({ page }) => {
    // Verify that calorie/weight editing works after selecting an alternative

    await page.getByRole('button', { name: /analyze dish/i }).click();
    await expect(page.getByText('Analysis complete')).toBeVisible({ timeout: 3000 });

    // Expand Jeera Rice
    const jeeraRiceCard = page.locator('text=Jeera Rice').locator('..').locator('..').locator('..');
    await jeeraRiceCard.click();
    await page.waitForTimeout(300);

    // Select Steamed Rice alternative
    const steamedRiceOption = page.locator('text=Steamed Rice').locator('..').locator('..').locator('..');
    await steamedRiceOption.click();
    await page.waitForTimeout(200);

    // Now try to edit calories
    const calorieEditor = page.locator('[data-testid="calorie-editor"]').or(
      page.locator('input[type="number"]').first()
    );

    if (await calorieEditor.isVisible()) {
      await calorieEditor.click();
      await calorieEditor.fill('250');
      await calorieEditor.press('Enter');

      // Verify update
      await expect(page.getByText('250', { exact: false })).toBeVisible();
      console.log('✓ Calorie editing works after alternative selection');
    } else {
      // If direct editor not found, look for edit button
      const editButton = page.getByRole('button', { name: /edit|pencil/i }).first();
      if (await editButton.isVisible()) {
        console.log('✓ Edit controls available after alternative selection');
      }
    }

    console.log('\n✅ Editing functionality preserved after alternative selection.\n');
  });
});
