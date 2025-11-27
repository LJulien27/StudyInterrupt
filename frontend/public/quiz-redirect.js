// quiz-redirect.js
// Read quizId and interruptId from query string, persist minimal markers and navigate to the app quiz route.
(function () {
  try {
    const params = new URLSearchParams(location.search);
    const quizId = params.get('quizId') || '';
    const interruptId = params.get('interruptId') || '';
    // Prefer chrome.storage when available
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && typeof chrome.storage.local.set === 'function') {
        try {
          chrome.storage.local.set({ si_interrupt_pending: true, si_pending_interrupt_quizId: String(quizId), si_pending_interrupt_id: String(interruptId) }, () => {
            // navigate to app with hash route
            try {
              location.replace(chrome.runtime.getURL('build/index.html') + '#/quiz?quizId=' + encodeURIComponent(quizId) + (interruptId ? '&interruptId=' + encodeURIComponent(interruptId) : ''));
            } catch (e) {
              location.replace('build/index.html' + '#/quiz?quizId=' + encodeURIComponent(quizId));
            }
          });
          return;
        } catch (e) { /* fallthrough to localStorage */ }
      }
    } catch (e) { /* ignore */ }
    try {
      localStorage.setItem('si_interrupt_pending', 'true');
      localStorage.setItem('si_pending_interrupt_quizId', String(quizId));
      localStorage.setItem('si_pending_interrupt_id', String(interruptId));
    } catch (e) { /* ignore */ }
    try {
      location.replace(chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('build/index.html') + '#/quiz?quizId=' + encodeURIComponent(quizId) + (interruptId ? '&interruptId=' + encodeURIComponent(interruptId) : '') : 'build/index.html' + '#/quiz?quizId=' + encodeURIComponent(quizId));
    } catch (e) {
      try { location.replace('build/index.html'); } catch (e2) { /* ignore */ }
    }
  } catch (e) {
    console.warn('quiz-redirect failed', e);
    try {
      location.replace(chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('build/index.html') : 'build/index.html');
    } catch (e2) { /* ignore */ }
  }
})();
