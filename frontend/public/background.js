// Fetches the user's API key
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchData") {
        fetch("https://api.example.com/data", {
            method: "GET",
            headers: { "Authorization": "Bearer YOUR_API_KEY" }
        })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error }));

        return true; // Keeps the message channel open for async response
    }
});

/*
    Session interrupt scheduler
    - Listens for messages: { type: 'SESSION_STARTED', sessionId, interrupt_interval_minutes }
                                                 { type: 'SESSION_STOPPED' }
    - Stores session state in chrome.storage.local (si_session_active, si_session_id, si_session_interval)
    - Schedules a repeating alarm named 'si_interrupt' at the requested interval (minutes)
    - When alarm fires, opens popup.html in a new tab so the user sees the interrupt UI
*/

const STORAGE_KEYS = {
    ACTIVE: 'si_session_active',
    ID: 'si_session_id',
    INTERVAL: 'si_session_interval',
    LAST: 'si_last_interrupt_at',
    NEXT: 'si_next_due',
    END: 'si_session_end',
    PENDING: 'si_interrupt_pending',
    // index of the next interrupt to schedule (internal counter)
    INDEX: 'si_current_interrupt_index',
    // the interrupt index that just fired (set when alarm fires)
    INDEX_NOW: 'si_current_interrupt_now'
    ,
    // stored interrupt payloads for this session (array)
    INTERRUPTS: 'si_session_interrupts'
};

function scheduleInterrupts(intervalMinutes) {
    if (!intervalMinutes || Number.isNaN(Number(intervalMinutes))) return;
    // Clear any existing alarm and create a new repeating alarm
    try {
        chrome.alarms.clear('si_interrupt', () => {
            chrome.alarms.create('si_interrupt', { periodInMinutes: Number(intervalMinutes) });
            // record an estimated next due time (first firing approx one interval from now)
            try {
                const nextDue = Date.now() + Number(intervalMinutes) * 60000;
                chrome.storage.local.set({ [STORAGE_KEYS.NEXT]: nextDue }, () => {
                    console.log('Scheduled si_interrupt every', intervalMinutes, 'minutes; next due at', new Date(nextDue).toISOString());
                });
            } catch (e) {
                console.warn('Failed to persist next due timestamp', e);
            }
        });
    } catch (e) {
        console.warn('Alarms API not available', e);
    }
}

function clearInterrupts() {
    try {
        chrome.alarms.clear('si_interrupt', (wasCleared) => {
            console.log('Cleared si_interrupt alarm:', wasCleared);
        });
    } catch (e) {
        console.warn('Alarms API not available', e);
    }
}

// Stop the active session: clear stored active flag, pending flag and alarms.
function stopSession(reason) {
    try {
        // clear active flag and auxiliary session keys
        const toClear = {
            [STORAGE_KEYS.ACTIVE]: false,
            [STORAGE_KEYS.PENDING]: false,
            [STORAGE_KEYS.ID]: null,
            [STORAGE_KEYS.INDEX]: 0,
            [STORAGE_KEYS.INDEX_NOW]: null,
            [STORAGE_KEYS.NEXT]: null,
            [STORAGE_KEYS.LAST]: null,
            [STORAGE_KEYS.INTERRUPTS]: null
        };
        chrome.storage.local.set(toClear, () => {
            console.log('Session stopped (auto):', reason || '(no reason)');
        });
    } catch (e) {
        console.warn('Failed to persist session stopped state', e);
    }
    // Clear scheduled interrupts
    clearInterrupts();
}

// Robust popup opener: try chrome.action.openPopup(), fall back to opening the popup HTML in a tab
function openPopupUIFallback(manifestPopupPath = 'public/popup.html') {
    try {
        const url = chrome.runtime.getURL(manifestPopupPath);
        chrome.tabs.create({ url }, (tab) => {
            console.log('Fallback: opened popup page as tab', tab && tab.id);
        });
    } catch (e) {
        console.warn('Fallback tab open failed', e);
    }
}

function tryOpenPopup(manifestPopupPath = 'public/popup.html') {
    if (chrome.action && typeof chrome.action.openPopup === 'function') {
        try {
            const maybePromise = chrome.action.openPopup();
            // Handle promise-based implementations
            if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.catch((err) => {
                    console.warn('chrome.action.openPopup() rejected, falling back to tab:', err);
                    openPopupUIFallback(manifestPopupPath);
                });
            }
            return;
        } catch (err) {
            console.warn('chrome.action.openPopup() threw, falling back to tab:', err);
            openPopupUIFallback(manifestPopupPath);
            return;
        }
    }

    // API not available: fallback
    openPopupUIFallback(manifestPopupPath);
}

// React to incoming messages for session control
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    switch (msg.type) {
        case 'SESSION_STARTED': {
            const interval = msg.interrupt_interval_minutes || msg.interval || 1;
            const sessionId = msg.sessionId || msg.session_id || null;

            // Read current stored session state to decide whether this is a duplicate
            try {
                chrome.storage.local.get([STORAGE_KEYS.ACTIVE, STORAGE_KEYS.ID, STORAGE_KEYS.INTERVAL], (items) => {
                    const storedActive = items && items[STORAGE_KEYS.ACTIVE];
                    const storedId = (items && items[STORAGE_KEYS.ID]) || null;
                    const storedInterval = items && Number(items[STORAGE_KEYS.INTERVAL]);

                    // If the same active sessionId and interval are already stored, treat as duplicate and no-op
                    if (storedActive && storedId === sessionId && Number(storedInterval) === Number(interval)) {
                        console.log('SESSION_STARTED ignored (duplicate)', sessionId, interval);
                        sendResponse({ ok: true, deduped: true });
                        return;
                    }

                    // Otherwise persist the new session info and schedule interrupts (scheduleInterrupts will clear existing alarm)
                    const toStore = { [STORAGE_KEYS.ACTIVE]: true, [STORAGE_KEYS.ID]: sessionId, [STORAGE_KEYS.INTERVAL]: Number(interval), [STORAGE_KEYS.PENDING]: false };
                    // if caller provided an end_time or endTime (ISO), store normalized timestamp
                    const endParam = msg.end_time || msg.endTime || msg.session_end || null;
                    if (endParam) {
                        const endTs = Number(new Date(endParam));
                        if (!Number.isNaN(endTs)) toStore[STORAGE_KEYS.END] = endTs;
                    } else {
                        // If no explicit end provided, try to compute from duration and optional start_time
                        const dur = msg.duration || msg.duration_minutes || msg.durationMinutes || null;
                        const startParam = msg.start_time || msg.startTime || null;
                        if (dur) {
                            const durationNum = Number(dur);
                            if (!Number.isNaN(durationNum) && durationNum > 0) {
                                let base = Date.now();
                                if (startParam) {
                                    const s = Number(new Date(startParam));
                                    if (!Number.isNaN(s)) base = s;
                                }
                                toStore[STORAGE_KEYS.END] = base + durationNum * 60000;
                            }
                        }
                    }
                    // initialize interrupt indexing so popup can fetch the proper interrupt payload
                    toStore[STORAGE_KEYS.INDEX] = 0;
                    toStore[STORAGE_KEYS.INDEX_NOW] = null;
                    // initialize interrupt indexing so popup can fetch the proper interrupt payload
                    toStore[STORAGE_KEYS.INDEX] = 0;
                    toStore[STORAGE_KEYS.INDEX_NOW] = null;
                    chrome.storage.local.set(toStore, () => {
                        console.log('Session started stored', sessionId, interval);
                    });

                    // schedule alarms
                    scheduleInterrupts(Number(interval));

                    // fetch full interrupt payloads for this session and store them locally for fast popup rendering
                    if (sessionId) {
                        try {
                            fetch(`https://studyinterruptbackend.onrender.com/sessions/${sessionId}/interrupts`)
                                .then((r) => {
                                    if (!r.ok) throw new Error('Failed to fetch interrupts: ' + r.status);
                                    return r.json();
                                })
                                .then((body) => {
                                    const raw = body && body.interrupts ? body.interrupts : [];
                                    // trim to necessary fields to save storage and bandwidth
                                    const ints = Array.isArray(raw)
                                        ? raw.map((it) => ({
                                            _id: it && (it._id || it.id) ? (it._id || it.id) : null,
                                            type: it && it.type != null ? it.type : null,
                                            link: it && (it.link || it.url) ? (it.link || it.url) : null,
                                            quiz_id: it && (it.quiz_id || it.quizId) ? (it.quiz_id || it.quizId) : null,
                                            interrupt_time: it && (it.interrupt_time || it.time) ? (it.interrupt_time || it.time) : null,
                                            title: it && (it.title || it.name) ? (it.title || it.name) : null
                                        }))
                                        : [];
                                    try {
                                        chrome.storage.local.set({ [STORAGE_KEYS.INTERRUPTS]: ints }, () => {
                                            console.log('Stored', (ints && ints.length) || 0, 'trimmed interrupts for session', sessionId);
                                        });
                                    } catch (e) {
                                        console.warn('Failed to persist interrupts to storage', e);
                                    }
                                })
                                .catch((err) => console.warn('Error fetching session interrupts', err));
                        } catch (e) {
                            console.warn('Could not fetch session interrupts', e);
                        }
                    }

                    sendResponse({ ok: true, deduped: false });
                });
            } catch (e) {
                // If storage API fails for some reason, fall back to previous behavior
                console.warn('Storage API access failed during SESSION_STARTED dedupe, falling back', e);
                try {
                    try {
                        const toStore = { [STORAGE_KEYS.ACTIVE]: true, [STORAGE_KEYS.ID]: sessionId, [STORAGE_KEYS.INTERVAL]: Number(interval) };
                        const endParam = msg.end_time || msg.endTime || msg.session_end || null;
                        if (endParam) {
                            const endTs = Number(new Date(endParam));
                            if (!Number.isNaN(endTs)) toStore[STORAGE_KEYS.END] = endTs;
                        }
                        chrome.storage.local.set(toStore, () => {
                            console.log('Session started stored (fallback)', sessionId, interval);
                        });
                    } catch (err2) {
                        console.warn('Failed fallback persist', err2);
                    }
                    scheduleInterrupts(Number(interval));
                    sendResponse({ ok: true, deduped: false });
                } catch (err) {
                    console.warn('Failed to persist session in fallback path', err);
                    sendResponse({ ok: false, error: String(err) });
                }
            }

            break;
        }

        case 'SESSION_STOPPED': {
            // centralize stop logic
            try {
                stopSession('explicit STOP message');
                sendResponse({ ok: true });
            } catch (e) {
                console.warn('SESSION_STOPPED handling failed', e);
                sendResponse({ ok: false, error: String(e) });
            }
            break;
        }

        case 'ACCEPT_INTERRUPT': {
            // Clear pending flag when user accepts the interrupt
            try {
                chrome.storage.local.set({ [STORAGE_KEYS.PENDING]: false }, () => {
                    console.log('Cleared interrupt pending flag (accepted)');
                });
                sendResponse({ ok: true });
            } catch (e) {
                console.warn('Failed to clear pending flag on ACCEPT_INTERRUPT', e);
                sendResponse({ ok: false, error: String(e) });
            }
            break;
        }

        case 'START_QUICK_SESSION': {
            // Create quick-session defaults: start now, end 1 hour later, 15 minute interval, non-public
            const start = new Date();
            const end = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
            const interval = 15;

            // Construct a URL that opens the web app create-session route with prefilled query params.
            // The web app should read ?quick=1 and pre-fill the form (select quizzes) — it can then POST.
            try {
                if (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
                    const base = chrome.runtime.getURL('create-session');
                    const params = `quick=1&start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&interval=${interval}&is_public=false`;
                    // Open the extension create-session page with query params
                    const url = `${base}?${params}`;
                    if (chrome.tabs && typeof chrome.tabs.create === 'function') {
                        chrome.tabs.create({ url }, (tab) => {
                            console.log('Opened quick session create page', tab && tab.id);
                            sendResponse({ ok: true, opened: true });
                        });
                    } else {
                        // Tabs API unavailable: fall back to opening popup page without params
                        const fallback = chrome.runtime.getURL('public/popup.html');
                        chrome.tabs.create({ url: fallback }, (tab) => {
                            console.log('Tabs API missing; opened popup fallback', tab && tab.id);
                            sendResponse({ ok: true, opened: false, fallback: true });
                        });
                    }
                } else {
                    console.warn('chrome.runtime.getURL not available; cannot open quick create');
                    sendResponse({ ok: false, error: 'runtime.getURL unavailable' });
                }
            } catch (e) {
                console.warn('Error handling START_QUICK_SESSION', e);
                tryOpenPopup('public/popup.html');
                sendResponse({ ok: false, error: String(e) });
            }
            break;
        }

        default:
            // ignore
            break;
    }
    // Return true if we'll call sendResponse asynchronously (we responded synchronously here)
    return true;
});

// When an alarm fires, open the popup page
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === 'si_interrupt') {
        console.log('si_interrupt alarm fired — checking session end, updating timestamps and opening popup');
        // read interval, end and active state before proceeding
        try {
            chrome.storage.local.get([STORAGE_KEYS.INTERVAL, STORAGE_KEYS.END, STORAGE_KEYS.ACTIVE], (items) => {
                const active = items && items[STORAGE_KEYS.ACTIVE];
                const interval = (items && Number(items[STORAGE_KEYS.INTERVAL])) || 15;
                const endTs = items && Number(items[STORAGE_KEYS.END]);
                const now = Date.now();

                // If the session is not active, nothing to do
                if (!active) {
                    console.log('si_interrupt fired but no active session; ignoring');
                    return;
                }

                // If an end timestamp exists and we've reached or passed it, stop the session instead of firing an interrupt
                if (Number.isFinite(endTs) && endTs > 0 && now >= endTs) {
                    console.log('Session end_time reached; stopping session instead of firing interrupt');
                    stopSession('end_time reached');
                    return;
                }

                // otherwise compute next due and mark pending as before
                const nextDue = now + Number(interval) * 60000;
                // atomically update last/next/pending and set the index of the interrupt that just fired
                chrome.storage.local.get([STORAGE_KEYS.INDEX], (idxItems) => {
                    const curIdx = (idxItems && Number(idxItems[STORAGE_KEYS.INDEX])) || 0;
                    chrome.storage.local.set({
                        [STORAGE_KEYS.LAST]: now,
                        [STORAGE_KEYS.NEXT]: nextDue,
                        [STORAGE_KEYS.PENDING]: true,
                        [STORAGE_KEYS.INDEX_NOW]: curIdx,
                        [STORAGE_KEYS.INDEX]: curIdx + 1
                    }, () => {
                        console.log('Recorded last interrupt timestamp, next due, set pending and current interrupt index', new Date(now).toISOString(), new Date(nextDue).toISOString(), 'idx=', curIdx);
                        tryOpenPopup('public/popup.html');
                    });
                });
            });
        } catch (e) {
            console.warn('Failed to update timestamps on alarm fire', e);
            tryOpenPopup('public/popup.html');
        }
    }
});

// On startup/install, if a session is active in storage re-schedule the alarm
function restoreSessionFromStorage() {
    try {
        chrome.storage.local.get([STORAGE_KEYS.ACTIVE, STORAGE_KEYS.INTERVAL, STORAGE_KEYS.ID, STORAGE_KEYS.END], (items) => {
            if (items && items[STORAGE_KEYS.ACTIVE]) {
                const endTs = items && Number(items[STORAGE_KEYS.END]);
                const now = Date.now();
                if (Number.isFinite(endTs) && endTs > 0 && now >= endTs) {
                    // session already expired while extension was not running — stop it
                    console.log('Stored session has already expired on startup; stopping');
                    stopSession('expired on startup');
                    return;
                }
                const interval = items[STORAGE_KEYS.INTERVAL] || 1;
                console.log('Restoring active session alarm with interval', interval);
                scheduleInterrupts(Number(interval));
            }
        });
    } catch (e) {
        console.warn('Storage API not available', e);
    }
}

chrome.runtime.onInstalled.addListener(() => restoreSessionFromStorage());
chrome.runtime.onStartup.addListener(() => restoreSessionFromStorage());