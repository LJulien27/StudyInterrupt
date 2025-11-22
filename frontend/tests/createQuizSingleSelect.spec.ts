import { test, expect } from '@playwright/test';

test('Create a quiz with one question and three options', async ({ page }) => {
  let quizId: string | null = null;

  // --- Intercept POST /quizzes and capture the quiz ID ---
  page.on('response', async (response) => {
    if (response.url().includes('/quizzes') && response.request().method() === 'POST') {
      try {
        // Only parse JSON if this is not a redirect
        if (response.status() >= 200 && response.status() < 300 && !response.headers()['location']) {
          const data = await response.json();
          if (data._id || data.id) {
            quizId = data._id || data.id;
            console.log('✅ Captured quizId:', quizId);
          } else {
            console.log('⚠️ Quiz created but ID not found in response:', data);
          }
        } else {
          console.log('Skipped non-JSON or redirect response for POST /quizzes');
        }
      } catch {
        // ignore non-JSON
      }
    }
  });

  // --- Create quiz via UI ---
  await page.goto('/');
  await page.getByRole('link', { name: 'Create A Quiz' }).click();
  await page.getByPlaceholder('Enter quiz name').fill('Playwright Quiz');
  await page.getByPlaceholder('Enter class name').fill('Geography');
  await page.getByRole('button', { name: 'Add Question' }).click();
  await page.getByLabel('Question').fill('What country are we in?');
  await page.getByLabel('Option 1').fill('Canada');
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: 'Add Option' }).click();
  await page.getByLabel('Option 2').fill('US');
  await page.getByRole('button', { name: 'Add Option' }).click();
  await page.getByLabel('Option 3').fill('UK');
  await page.getByRole('button', { name: 'Save Question' }).click();

  // --- Submit quiz ---
  const dialogPromise = page.waitForEvent('dialog');
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe('Your quiz has been submitted');
  await dialog.accept();

  // Toggle breakpoint if you want to see the quiz before it gets deleted
  // await page.pause();

  // --- Wait a bit for POST to finish ---
  await page.waitForTimeout(1000);

  // --- Cleanup ---
  if (!quizId) {
    throw new Error('❌ Quiz ID not captured. The backend may be redirecting instead of returning JSON.');
  }

  const deleteResponse = await page.request.delete(`http://localhost:8000/quizzes/${quizId}`, {
    headers: { accept: 'application/json' },
  });

  expect(deleteResponse.ok()).toBeTruthy();
  const body = await deleteResponse.json();
  expect(body.message).toBe('Quiz deleted successfully');
  console.log('🧹 Deleted quiz successfully');
});


