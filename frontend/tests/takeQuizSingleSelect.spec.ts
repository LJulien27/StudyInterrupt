import { test, expect } from '@playwright/test';

test('Take Quiz created via API and verify 100% score', async ({ page, request }) => {
  // -----------------------------
  // Step 1 - SETUP: Create Quiz via API
  // -----------------------------
  const quizPayload = {
    title: 'Playwright test for takeQuiz',
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
  // Step 2 - SETUP: Create Question via API
  // -----------------------------
  const questionPayload = {
    type: 1,
    text: 'Click on true.',
    body: 'True&!!&False',
    answer: 'True',
    quiz_id: quizId,
  };

  const questionResponse = await request.post('http://localhost:8000/questions/', {
    data: questionPayload,
    headers: { accept: 'application/json' },
  });

  expect(questionResponse.ok()).toBeTruthy();
  const questionData = await questionResponse.json();
  console.log(`✅ Created question with id: ${questionData._id}`);

  // -----------------------------
  // Step 3 - TEST: Take the quiz via UI
  // -----------------------------
  await page.goto('http://localhost:3000');

  // Go to "Quizzes" tab
  await page.getByRole('link', { name: 'Quizzes' }).click();

  // Find and click the dynamically created quiz by title
  await page.getByRole('button', { name: quizPayload.title }).click();

  // Answer question (select “True” from combobox)
  const dropdown = page.getByRole('combobox');
  await dropdown.selectOption('True');

  // Submit quiz and verify alert
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.message()).toBe('Quiz Submitted! You scored 100%');
      await dialog.accept();
    }),
    page.getByRole('button', { name: 'Submit Quiz' }).click(),
  ]);

  // -----------------------------
  // Step 4 - CLEANUP: Delete Quiz (and its question)
  // -----------------------------
  const deleteResponse = await request.delete(`http://localhost:8000/quizzes/${quizId}`, {
    headers: { accept: 'application/json' },
  });

  expect(deleteResponse.ok()).toBeTruthy();
  const deleteBody = await deleteResponse.json();
  expect(deleteBody.message).toBe('Quiz deleted successfully');
  console.log('🧹 Deleted quiz successfully (question auto-deleted)');
});
