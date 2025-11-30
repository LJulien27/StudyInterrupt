import { test, expect } from '@playwright/test';

test('Take FILLBLANK Quiz created via API and verify 100% score', async ({ page, request }) => {
  // Generate unique quiz title using timestamp
  const timestamp = Date.now();
  const uniqueTitle = `Playwright FillBlank Quiz ${timestamp}`;

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
  // Step 2 - SETUP: Create FillBlank Question via API
  // -----------------------------
  const questionPayload = {
    type: 3, // FILLBLANK — matches your QuestionType enum
    text: 'The capital of France is',
    body: '',
    answer: 'Paris',
    quiz_id: quizId,
  };

  const questionResponse = await request.post('http://localhost:8000/questions/', {
    data: questionPayload,
    headers: { accept: 'application/json' },
  });

  expect(questionResponse.ok()).toBeTruthy();
  const questionData = await questionResponse.json();

  console.log(`✅ Created FILLBLANK question with id: ${questionData._id}`);

  // -----------------------------
  // Step 3 - TEST: Take the quiz via UI
  // -----------------------------
  await page.goto('http://localhost:3000');

  // Open Quizzes tab
  await page.getByRole('link', { name: 'Quizzes' }).click();

  // Click dynamically created quiz
  await page.getByRole('button', { name: uniqueTitle }).click();

  // -----------------------------
  // FILLBLANK USER ACTION
  // -----------------------------
  await page.locator('input[type="text"]').first().fill('Paris');

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
