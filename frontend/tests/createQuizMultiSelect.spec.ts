import { test, expect } from '@playwright/test';

test('Create a quiz with one multi-select question', async ({ page }) => {
  let quizId: string | null = null;

  // --- Capture POST /quizzes response ---
  page.on('response', async (response) => {
    if (response.url().includes('/quizzes') && response.request().method() === 'POST') {
      try {
        if (response.status() >= 200 && response.status() < 300 && !response.headers()['location']) {
          const data = await response.json();
          if (data._id || data.id) {
            quizId = data._id || data.id;
            console.log('✅ Captured quizId:', quizId);
          }
        }
      } catch {
        // ignore non-JSON
      }
    }
  });

  // --- Create quiz via UI ---
  await page.goto('/');
  await page.getByRole('link', { name: 'Create A Quiz' }).click();

  await page.getByPlaceholder('Enter quiz name').fill('Playwright Multi-Select Quiz');
  // await page.getByPlaceholder('Enter class name').fill('Canadian Studies');

  // Add question
  await page.getByRole('button', { name: 'Add Question' }).click();

  // Select "Multi Select Multiple Choice"
  await page.getByRole('combobox').selectOption('Multi Select Multiple Choice');

  // Fill question text
  await page.getByLabel('Question').fill('What are the official languages of Canada');

  // Fill Option 1 - English (correct)
  await page.getByLabel('Option 1').fill('English');
  await page.locator('input[type="checkbox"]').nth(0).check();

  // Option 2 - French (correct)
  await page.getByRole('button', { name: 'Add Option' }).click();
  await page.getByLabel('Option 2').fill('French');
  await page.locator('input[type="checkbox"]').nth(1).check();

  // Option 3 - German
  await page.getByRole('button', { name: 'Add Option' }).click();
  await page.getByLabel('Option 3').fill('German');

  // Option 4 - Japanese
  await page.getByRole('button', { name: 'Add Option' }).click();
  await page.getByLabel('Option 4').fill('Japanese');

  // Save Question
  await page.getByRole('button', { name: 'Save Question' }).click();

  // Submit quiz
  const dialogPromise = page.waitForEvent('dialog');
  await page.getByRole('button', { name: 'Submit Quiz' }).click();

  const dialog = await dialogPromise;
  expect(dialog.message()).toBe('Your quiz has been submitted');
  await dialog.accept();

  await page.waitForTimeout(1000);

  // --- Cleanup ---
  if (!quizId) {
    throw new Error('❌ Quiz ID not captured. Backend may be redirecting instead of returning JSON.');
  }

  const deleteResponse = await page.request.delete(`http://localhost:8000/quizzes/${quizId}`, {
    headers: { accept: 'application/json' },
  });

  expect(deleteResponse.ok()).toBeTruthy();
  const body = await deleteResponse.json();
  expect(body.message).toBe('Quiz deleted successfully');
  console.log('🧹 Deleted quiz successfully');
});
