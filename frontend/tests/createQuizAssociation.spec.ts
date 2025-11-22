import { test, expect } from '@playwright/test';

test('Create a quiz with one Association Question', async ({ page }) => {
  let quizId: string | null = null;

  // Capture POST /quizzes
  page.on('response', async (response) => {
    if (response.url().includes('/quizzes') && response.request().method() === 'POST') {
      try {
        if (response.status() >= 200 && response.status() < 300 && !response.headers()['location']) {
          const data = await response.json();
          if (data._id || data.id) quizId = data._id || data.id;
        }
      } catch {}
    }
  });

  // Go to Create Quiz
  await page.goto('/');
  await page.getByRole('link', { name: 'Create A Quiz' }).click();

  await page.getByPlaceholder('Enter quiz name').fill('Playwright Association Quiz');
  await page.getByPlaceholder('Enter class name').fill('Political Science');

  // Add question
  await page.getByRole('button', { name: 'Add Question' }).click();

  // Select Association Question
  await page.getByRole('combobox').selectOption('Association Question');

  // Main prompt
  await page.getByLabel('Question').fill('Match the following words with their definition:');

  // LEFT OPTION 1
  await page.getByLabel('Left Option 1').fill('Liberalism');

  // Click once — generates Left Option 2–4 and Right Option 1–2
  await page.getByRole('button', { name: 'Add Association Option' }).click();

  // LEFT OPTION 2
  await page.getByLabel('Left Option 2').fill('Conservatism');

  // RIGHT OPTION 1
  await page.getByLabel('Right Option 1').fill(
    'A political ideology focused on preserving tradition, social stability, established institutions, and cautious, gradual change.'
  );

  // RIGHT OPTION 2
  await page.getByLabel('Right Option 2').fill(
    'A political ideology that emphasizes individual rights, personal freedom, equality, and limited government intervention in personal life.'
  );

  // --- ASSOCIATIONS ---

  const traditionDefinition =
    'A political ideology focused on preserving tradition, social stability, established institutions, and cautious, gradual change.';

  const individualRightsDefinition =
    'A political ideology that emphasizes individual rights, personal freedom, equality, and limited government intervention in personal life.';

  // Liberalism → individual rights
  await page.locator('select').nth(1).selectOption(individualRightsDefinition);

  // Conservatism → tradition
  await page.locator('select').nth(2).selectOption(traditionDefinition);

  // Save
  await page.getByRole('button', { name: 'Save Question' }).click();

  // Submit quiz
  const dialogPromise = page.waitForEvent('dialog');
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe('Your quiz has been submitted');
  await dialog.accept();

  await page.waitForTimeout(500);

  // Cleanup
  if (!quizId) throw new Error('Quiz ID not captured.');
  await page.request.delete(`http://localhost:8000/quizzes/${quizId}`, {
    headers: { accept: 'application/json' }
  });
});
