
document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById('status');
  const content = document.getElementById('content');
  const openWebAppButton = document.getElementById('openWebApp');
  const acceptButton = document.getElementById('acceptInterrupt');
  const quitButton = document.getElementById('quitSession');

  const hasChrome = typeof chrome !== 'undefined' && !!chrome.runtime;
  // current pending interrupt object (set when popup loads the pending interrupt)
  let currentPendingInterrupt = null;

  // Helper to set accept button enabled/disabled state with visual cue
  function setAcceptPending(enabled) {
    if (!acceptButton) return;
    try { acceptButton.disabled = !enabled; } catch (e) {}
    try {
      acceptButton.classList.toggle('disabled', !enabled);
      acceptButton.title = enabled ? 'Accept the interrupt' : 'No interrupt pending';
      acceptButton.style.opacity = enabled ? '' : '0.55';
      acceptButton.style.cursor = enabled ? 'pointer' : 'not-allowed';
    } catch (e) {}
  }

  async function fetchUserInfo(token) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });
    return res.json();
  }

  // Try to get a cached token; fall back to interactive sign-in.
  function tryAuth() {
    if (!hasChrome || !chrome.identity || !chrome.identity.getAuthToken) {
      status.textContent = 'Not running in extension — auth unavailable';
      return;
    }

    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.log('No cached token, prompting user interactively...');
        chrome.identity.getAuthToken({ interactive: true }, async (newToken) => {
          if (chrome.runtime.lastError || !newToken) {
            console.error('Login failed:', chrome.runtime.lastError);
            status.textContent = 'Not signed in';
            return;
          }
          try {
            const user = await fetchUserInfo(newToken);
            status.textContent = `Signed in as ${user.name}`;
          } catch (err) {
            console.error('Error fetching user info:', err);
            status.textContent = 'Error fetching profile';
          }
        });
      } else {
        (async () => {
          try {
            const user = await fetchUserInfo(token);
            status.textContent = `Signed in as ${user.name}`;
          } catch (err) {
            console.error('Error fetching user info:', err);
            status.textContent = 'Error fetching profile';
          }
        })();
      }
    });
  }

  // Open web app button behaviour
  if (openWebAppButton) {
    openWebAppButton.addEventListener('click', () => {
      if (hasChrome && chrome.tabs && chrome.runtime && chrome.runtime.getURL) {
        chrome.tabs.create({ url: chrome.runtime.getURL('build/index.html') });
      } else {
        window.open('index.html', '_blank');
      }
    });
  } else {
    console.error('Button #openWebApp not found!');
  }

  // Accept Interrupt behaviour — send a runtime message and close the popup.
  if (acceptButton) {
    acceptButton.addEventListener('click', () => {
      // If we have a currently-loaded pending interrupt, handle context-specific accept actions
      try {
        if (currentPendingInterrupt) {
          const it = currentPendingInterrupt;
          console.log('Accept clicked — currentPendingInterrupt:', it);
          // Determine types robustly
          const isQuiz = Number(it.type) === 1 || Boolean(it.quiz_id || it.quizId);
          const isLink = Number(it.type) === 2 || Boolean(it.link);

          if (isQuiz) {
            const quizId = it.quiz_id || it.quizId || it._id || '';
            const interruptId = it._id || it.id || it.interrupt_id || '';
            const rel = `#/quiz?quizId=${encodeURIComponent(quizId)}&interruptId=${encodeURIComponent(interruptId)}`;
            try {
              if (hasChrome && chrome.runtime && chrome.runtime.getURL && chrome.tabs && chrome.tabs.create) {
                const url = chrome.runtime.getURL('build/index.html') + rel;
                chrome.tabs.create({ url }, (tab) => {
                  console.log('Opened quiz tab', tab && tab.id);
                });
              } else {
                const url = 'index.html' + rel;
                window.open(url, '_blank');
              }
            } catch (e) {
              console.warn('Failed to open quiz tab', e);
            }
          } else if (isLink && it.link) {
            // Generic link interrupt
            try {
              if (hasChrome && chrome.tabs && chrome.tabs.create) {
                chrome.tabs.create({ url: it.link });
              } else {
                window.open(it.link, '_blank');
              }
            } catch (e) { console.warn('Failed to open link', e); }
          } else {
            console.log('Accept: no actionable data on currentPendingInterrupt');
          }
  }

        // If we didn't have the interrupt loaded into memory, try reading cached interrupts from storage
        if (!currentPendingInterrupt) {
          try {
            if (hasChrome && chrome.storage && chrome.storage.local && chrome.storage.local.get) {
              chrome.storage.local.get(['si_session_interrupts', 'si_current_interrupt_now'], (items) => {
                try {
                  const ints = items && items.si_session_interrupts ? items.si_session_interrupts : null;
                  const idx = Number(items && items.si_current_interrupt_now);
                  if (Array.isArray(ints) && ints.length > 0 && Number.isFinite(idx)) {
                    const it = ints[idx % ints.length];
                    if (it && it.link) {
                      try {
                        chrome.tabs.create ? chrome.tabs.create({ url: it.link }) : window.open(it.link, '_blank');
                      } catch (e) { window.open(it.link, '_blank'); }
                    }
                  }
                } catch (e) { console.warn('Failed to open cached interrupt link', e); }
              });
            } else {
              // fallback to localStorage
              try {
                const raw = localStorage.getItem('si_session_interrupts');
                const idx = Number(localStorage.getItem('si_current_interrupt_now'));
                const ints = raw ? JSON.parse(raw) : null;
                if (Array.isArray(ints) && ints.length > 0 && Number.isFinite(idx)) {
                  const it = ints[idx % ints.length];
                  if (it && it.link) window.open(it.link, '_blank');
                }
              } catch (e) { /* ignore */ }
            }
          } catch (e) { console.warn('Failed to read cached interrupt for accept fallback', e); }
        }

        status.textContent = 'Interrupt accepted';
        try { setAcceptPending(false); } catch (e) {}
        // Send a message to background if available
        if (hasChrome && chrome.runtime && chrome.runtime.sendMessage) {
          try {
            chrome.runtime.sendMessage({ type: 'ACCEPT_INTERRUPT' }, (resp) => {
              console.log('ACCEPT_INTERRUPT response', resp);
            });
          } catch (err) {
            console.warn('sendMessage failed', err);
          }
        } else {
          console.log('ACCEPT_INTERRUPT (simulated)');
        }
        // Clear pending flag and any current interrupt marker in storage so popup will return to active view
        try {
          if (hasChrome && chrome.storage && chrome.storage.local && chrome.storage.local.set) {
            try { chrome.storage.local.set({ si_interrupt_pending: false, si_current_interrupt_now: null }); } catch (e) {}
          } else {
            try { localStorage.setItem('si_interrupt_pending', 'false'); localStorage.removeItem('si_current_interrupt_now'); } catch (e) {}
          }
        } catch (e) { /* ignore */ }
      } catch (e) {
        console.warn('Error handling accept', e);
      }
      // Close the popup window (if running inside an extension this will dismiss the popup)
      try { window.close(); } catch (e) { /* ignore */ }
    });
  } else {
    console.error('Button #acceptInterrupt not found!');
  }

  // Render the base case UI when there is no active session
  function renderNoSessionView() {
    if (!content) return;
    // hide the accept button
    if (acceptButton) acceptButton.style.display = 'none';
    if (quitButton) quitButton.style.display = 'none';

    content.innerHTML = `
      <div>
        <p><strong>No active session</strong></p>
        <p>There are no scheduled interruptions right now. Open the web app to create a session.</p>
        <!-- Start Quick Session and Create Session buttons temporarily disabled -->
        <!--
        <div style="display:flex;gap:8px;margin-top:8px">
          <button id="startQuick" class="primary">Start Quick Session</button>
          <button id="openCreate" class="neutral">Create Session</button>
        </div>
        -->
      </div>
    `;

    status.textContent = 'No active session';

    // Wire buttons (use setTimeout to ensure elements are in DOM)
    setTimeout(() => {
      // Start Quick Session and Create Session handlers temporarily disabled
      /*
      const startQuick = document.getElementById('startQuick');
      const openCreate = document.getElementById('openCreate');
      if (startQuick) {
        startQuick.addEventListener('click', () => {
          status.textContent = 'Starting quick session…';
          if (hasChrome && chrome.runtime && chrome.runtime.sendMessage) {
            try {
              chrome.runtime.sendMessage({ type: 'START_QUICK_SESSION' }, (resp) => {
                console.log('START_QUICK_SESSION response', resp);
              });
            } catch (e) {
              console.warn('START_QUICK_SESSION send failed', e);
            }
          } else {
            // Fallback: open create session page
            if (openCreate) openCreate.click();
          }
        });
      }
      if (openCreate) {
        openCreate.addEventListener('click', () => {
          if (hasChrome && chrome.tabs && chrome.runtime && chrome.runtime.getURL) {
            // open the extension page for create-session (root path)
            try {
              chrome.tabs.create({ url: chrome.runtime.getURL('create-session') });
            } catch (e) {
              console.warn('Failed to open create session tab', e);
              // fallback to opening a relative create-session path
              window.open('create-session', '_blank');
            }
          } else {
            window.open('create-session', '_blank');
          }
        });
      }
      */
      // Quit button (also hidden here in no-session view)
      if (quitButton) {
        quitButton.addEventListener('click', () => {
          status.textContent = 'No session to quit';
        });
      }
    }, 0);
  }

  // Check session state in storage and render appropriate view.
  function checkSessionState() {
    if (hasChrome && chrome.storage && chrome.storage.local && chrome.storage.local.get) {
        try {
          // include the pending flag so we know whether Accept should be enabled
          chrome.storage.local.get(['si_session_active', 'si_session_interval', 'si_last_interrupt_at', 'si_next_due', 'si_session_end', 'si_interrupt_pending'], (items) => {
            const active = items && items.si_session_active;
            const interval = (items && Number(items.si_session_interval)) || 15;
            const last = items && Number(items.si_last_interrupt_at);
            const nextStored = items && Number(items.si_next_due);
            const endTs = items && Number(items.si_session_end);
            const pending = Boolean(items && items.si_interrupt_pending);
            if (active) {
              // show active view with countdown
              if (acceptButton) acceptButton.style.display = '';
              // set accept enabled only if an interrupt is pending (visual + disabled)
              setAcceptPending(pending);
              // compute next interrupt timestamp:
              // prefer explicit next_due if it's in the future; otherwise compute next multiple after last.
              const now = Date.now();
              let nextTs = null;
              if (Number.isFinite(nextStored) && nextStored > now) {
                nextTs = nextStored;
              } else if (Number.isFinite(last) && last > 0) {
                const periodMs = interval * 60000;
                const elapsed = now - last;
                const k = Math.max(1, Math.ceil(elapsed / periodMs));
                nextTs = last + k * periodMs;
              } else {
                nextTs = now + interval * 60000;
              }
              renderActiveView(nextTs, interval, (Number.isFinite(endTs) ? endTs : null), pending);
              // If there is a pending interrupt, attempt to fetch its payload (e.g. link payload)
              if (pending) {
                // try to load the pending interrupt details and render a richer view if available
                try {
                  chrome.storage.local.get(['si_session_id', 'si_current_interrupt_now'], (items2) => {
                    const sid = (items2 && items2.si_session_id) || null;
                    const idx = Number(items2 && items2.si_current_interrupt_now);
                    if (sid && Number.isFinite(idx)) {
                      loadAndRenderPendingInterrupt(sid, idx);
                    }
                  });
                } catch (e) {
                  console.warn('Failed to fetch pending interrupt info', e);
                }
              }
              status.textContent = 'Session active';
            } else {
              renderNoSessionView();
            }
          });
        } catch (e) {
          console.warn('Error reading storage for session state', e);
          renderNoSessionView();
        }
      } else {
      // Fallback when chrome.storage isn't available (e.g., running locally)
      const active = localStorage.getItem('si_session_active') === 'true';
      if (active) {
        if (acceptButton) acceptButton.style.display = '';
        // fallback: estimate next interrupt using default interval 15
        const interval = Number(localStorage.getItem('si_session_interval')) || 15;
        const nextTs = Date.now() + interval * 60000;
        const endTs = Number(localStorage.getItem('si_session_end')) || null;
        const pending = localStorage.getItem('si_interrupt_pending') === 'true';
  setAcceptPending(pending);
  renderActiveView(nextTs, interval, Number.isFinite(endTs) ? endTs : null, pending);
        // fallback: when running without chrome.storage we cannot fetch backend payloads
        if (pending) {
          // nothing to fetch in fallback mode
        }
        status.textContent = 'Session active';
      } else {
        renderNoSessionView();
      }
    }
  }

  // NOTE: YouTube-specific embed helper removed; videos are treated as generic links now.

  // Fetch interrupts for session and render the pending interrupt (if any)
  async function loadAndRenderPendingInterrupt(sessionId, index) {
    if (!content) return;
    try {
      // Prefer cached trimmed interrupts stored by background to avoid network calls
      const useCached = (hasChrome && chrome.storage && chrome.storage.local && chrome.storage.local.get);
      let interrupts = null;
      if (useCached) {
        try {
          await new Promise((resolve) => {
            try {
              chrome.storage.local.get(['si_session_interrupts'], (items) => {
                interrupts = items && items.si_session_interrupts ? items.si_session_interrupts : null;
                resolve(null);
              });
            } catch (e) { resolve(null); }
          });
        } catch (e) { interrupts = null; }
      }
      // If no cached interrupts found, fetch from backend
      if (!interrupts) {
        const res = await fetch(`https://studyinterruptbackend.onrender.com/sessions/${sessionId}/interrupts`);
        if (!res.ok) {
          console.warn('Failed to fetch interrupts for session', res.status);
          return;
        }
        const body = await res.json();
        interrupts = body && body.interrupts ? body.interrupts : [];
      }
      if (!Array.isArray(interrupts) || interrupts.length === 0) return;
      const idx = Number(index) || 0;
      const interrupt = interrupts[idx % interrupts.length];
      if (!interrupt) return;

  // expose to global handler so Accept button can act on it
  currentPendingInterrupt = interrupt;

  const isQuiz = Number(interrupt.type) === 1 || Boolean(interrupt.quiz_id || interrupt.quizId);
  if (!isQuiz) {
        // Render a simplified link preview for non-quiz interrupts. Accept will open the link.
        const title = interrupt.title || 'Link';
        content.innerHTML = `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <strong style="font-size:15px">${title}</strong>
              <div>
                <button id="popupWatchClose" class="neutral" style="margin-right:6px">Close</button>
              </div>
            </div>
            <div style="margin-top:8px">
              <p style="margin:0">${interrupt.interrupt_time || ''}</p>
              <p style="margin-top:8px;font-size:13px;color:#007bff;word-break:break-all">${interrupt.link}</p>
            </div>
          </div>
        `;

        setTimeout(() => {
          const closeBtn = document.getElementById('popupWatchClose');
          if (closeBtn) closeBtn.addEventListener('click', () => {
            try { localStorage.setItem('si_interrupt_pending', 'true'); } catch (e) {}
            checkSessionState();
          });
        }, 0);
      }
      else if (isQuiz) {
        // Render a small quiz preview without an Open button; Accept must be used to open the quiz
        const title = interrupt.title || 'Quiz';
        content.innerHTML = `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <strong style="font-size:15px">Quiz Interrupt</strong>
              <div>
                <button id="popupQuizClose" class="neutral" style="margin-right:6px">Close</button>
              </div>
            </div>
            <div style="margin-top:8px">
              <p style="margin:0">{Title}</p>
              <p style="margin:0;font-size:13px;color:#444">{time}</p>
            </div>
          </div>
        `.replace('{Title}', title).replace('{time}', interrupt.interrupt_time || '');

        setTimeout(() => {
          const closeBtn = document.getElementById('popupQuizClose');
          if (closeBtn) closeBtn.addEventListener('click', () => {
            checkSessionState();
          });
        }, 0);
      }
    } catch (e) {
      console.warn('Error loading pending interrupt', e);
    }
  }

  // Active view: show countdown to next interrupt and a small summary
  let activeTimerId = null;
  function renderActiveView(nextTimestamp, intervalMinutes, endTimestamp, pending = false) {
    if (!content) return;
    // ensure accept button visible
    if (acceptButton) acceptButton.style.display = '';
    if (quitButton) quitButton.style.display = '';

  // reflect pending state on the accept button immediately (visual + disabled)
  try { setAcceptPending(pending); } catch (e) {}

    function update() {
      const now = Date.now();
      const diff = Math.max(0, nextTimestamp - now);
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      const at = new Date(nextTimestamp);
      const atTime = at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Compute end display if provided
      let endHtml = '';
      if (endTimestamp && Number.isFinite(endTimestamp)) {
        const endDiff = Math.max(0, endTimestamp - now);
        const endMinutes = Math.ceil(endDiff / 60000);
        const endAt = new Date(endTimestamp);
        const endAtTime = endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        endHtml = `<p style="font-size:13px;color:#444">Session ends at ${endAtTime} (in ${endMinutes} min)</p>`;
      }

      content.innerHTML = `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <p style="margin:0"><strong style="font-size:16px;line-height:1;color:#111">Session active</strong></p>
            <div id="countdown" style="font-size:16px;line-height:1;font-weight:700;color:#111">${mm}:${ss}</div>
          </div>
          <div style="margin-top:8px">
            ${endHtml}
          </div>
        </div>
      `;
    }

    // Clear any previous timer
    if (activeTimerId) {
      clearInterval(activeTimerId);
      activeTimerId = null;
    }
    // Initial render
    update();
    // Update every 1s
    activeTimerId = setInterval(() => {
      update();
    }, 1000);
    // Wire quit button action (safe to reattach)
    try {
      if (quitButton) {
        quitButton.onclick = () => {
          // confirmation
          try {
            const ok = window.confirm('Are you sure you want to quit the current session?');
            if (!ok) return;
          } catch (e) {
            // confirm may fail in some environments; proceed
          }

          // disable the button while stopping
          try { quitButton.disabled = true; } catch (e) { /* ignore */ }
          const prevLabel = quitButton.textContent;
          try { quitButton.textContent = 'Quitting…'; } catch (e) {}
          status.textContent = 'Quitting session…';

          const finishLocal = (msg) => {
            try { localStorage.setItem('si_session_active', 'false'); } catch (_) {}
            renderNoSessionView();
            status.textContent = msg || 'Session stopped (local)';
          };

          if (hasChrome && chrome.runtime && chrome.runtime.sendMessage) {
            try {
              chrome.runtime.sendMessage({ type: 'SESSION_STOPPED' }, (resp) => {
                console.log('SESSION_STOPPED response', resp);
                // UI updated by renderNoSessionView
                // no need to re-enable button because view hides it
              });
            } catch (e) {
              console.warn('Failed to send SESSION_STOPPED', e);
              finishLocal('Session stopped (local)');
            }
          } else {
            finishLocal('Session stopped (local)');
          }

          // safety: if popup remains open and button was not hidden, re-enable after timeout
          setTimeout(() => {
            try {
              if (document.body.contains(quitButton) && quitButton.style.display !== 'none') {
                quitButton.disabled = false;
                quitButton.textContent = prevLabel;
              }
            } catch (e) { /* ignore */ }
          }, 5000);
        };
      }
    } catch (e) {
      console.warn('Failed to wire quit button', e);
    }
  }

  // initialize
  tryAuth();
  checkSessionState();
});

// NOTE: embedded player removed — YouTube interrupts are treated as regular links and opened in a new tab.