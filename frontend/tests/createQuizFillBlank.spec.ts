import { test, expect } from '@playwright/test';

test('Create a quiz with one Fill in the Blank question', async ({ page }) => {
  let quizId: string | null = null;

  // --- Capture POST /quizzes to get quizId ---
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
      } catch {}
    }
  });

  // --- Create quiz ---
  await page.goto('/');
  await page.getByRole('link', { name: 'Create A Quiz' }).click();

  await page.getByPlaceholder('Enter quiz name').fill('Playwright Fill in the Blank Quiz');
  await page.getByPlaceholder('Enter class name').fill('Astronomy');

  // Open question modal
  await page.getByRole('button', { name: 'Add Question' }).click();

  // Select "Fill in the Blank"
  await page.getByRole('combobox').selectOption('Fill in the Blank');

  // --- Fill fields using placeholders (reliable + unique) ---
  await page.getByPlaceholder('Enter prefix statement').fill('There are');
  await page.getByLabel('Answer').fill('365');
  await page.getByPlaceholder('Enter suffix statement').fill('days in a common year');

  // Save question
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
    throw new Error('❌ Quiz ID not captured. Backend may have redirected instead of returning JSON.');
  }

  const deleteResponse = await page.request.delete(`http://localhost:8000/quizzes/${quizId}`, {
    headers: { accept: 'application/json' },
  });

  expect(deleteResponse.ok()).toBeTruthy();
  const body = await deleteResponse.json();
  expect(body.message).toBe('Quiz deleted successfully');
  console.log('🧹 Deleted quiz successfully');
});
