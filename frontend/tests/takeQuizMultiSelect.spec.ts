import { test, expect } from '@playwright/test';

test('Take MULTISELECT Quiz created via API and verify 100% score', async ({ page, request }) => {
  // Generate a unique quiz title using timestamp
  const timestamp = Date.now();
  const uniqueTitle = `Playwright MultiSelect Quiz ${timestamp}`;

  // -----------------------------
  // Step 1 - SETUP: Create Quiz via API
  // -----------------------------
  const quizPayload = {
    title: uniqueTitle,
    creator_id: '68e5959e3a521fb2b1bfb12d',
    session_id: null,
    created_at: new Date().toISOString(),
  };

  const quizResponse = await request.post('http://localhost:8000/quizzes/', {
    data: quizPayload,
    headers: { accept: 'application/json' },
  });

  expect(quizResponse.ok()).toBeTruthy();
  const quizData = await quizResponse.json();
  const quizId = quizData._id;

  console.log(`✅ Created quiz with id: ${quizId}`);

  // -----------------------------
  // Step 2 - SETUP: Create MULTISELECT Question via API
  // -----------------------------
  const questionPayload = {
    type: 2, // MULTISELECT
    text: 'Select all European capitals.',
    body: 'Bangkok&!!&Berlin&!!&Barcelona&!!&London',
    answer: 'Berlin&!!&London',
    quiz_id: quizId,
  };

  const questionResponse = await request.post('http://localhost:8000/questions/', {
    data: questionPayload,
    headers: { accept: 'application/json' },
  });

  expect(questionResponse.ok()).toBeTruthy();
  const questionData = await questionResponse.json();

  console.log(`✅ Created MULTISELECT question with id: ${questionData._id}`);

  // -----------------------------
  // Step 3 - TEST: Take the quiz via UI
  // -----------------------------
  await page.goto('http://localhost:3000');

  // Open Quizzes tab
  await page.getByRole('link', { name: 'Quizzes' }).click();

  // Click the dynamically created quiz by its unique title
  await page.getByRole('button', { name: uniqueTitle }).click();

  // -----------------------------
  // MULTISELECT USER ACTION
  // -----------------------------
  // Check B
  await page.locator('label:has-text("Berlin")').locator('xpath=preceding-sibling::input').check();

  // Check D
  await page.locator('label:has-text("London")').locator('xpath=preceding-sibling::input').check();

  // -----------------------------
  // SUBMIT QUIZ → Expect 100%
  // -----------------------------
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.message()).toBe('Quiz Submitted! You scored 100%');
      await dialog.accept();
    }),
    page.getByRole('button', { name: 'Submit Quiz' }).click(),
  ]);

  // -----------------------------
  // Step 4 - CLEANUP: Delete Quiz
  // -----------------------------
  const deleteResponse = await request.delete(`http://localhost:8000/quizzes/${quizId}`, {
    headers: { accept: 'application/json' },
  });

  expect(deleteResponse.ok()).toBeTruthy();
  const deleteBody = await deleteResponse.json();
  expect(deleteBody.message).toBe('Quiz deleted successfully');

  console.log('🧹 Deleted quiz successfully');
});
