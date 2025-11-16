
document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById('status');
  const content = document.getElementById('content');
  const openWebAppButton = document.getElementById('openWebApp');
  const acceptButton = document.getElementById('acceptInterrupt');
  const otherAction = document.getElementById('otherAction');

  const hasChrome = typeof chrome !== 'undefined' && !!chrome.runtime;

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
      status.textContent = 'Interrupt accepted';
      // Send a message to background if available
      if (hasChrome && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          chrome.runtime.sendMessage({ type: 'ACCEPT_INTERRUPT' }, (resp) => {
            // optional callback
            console.log('ACCEPT_INTERRUPT response', resp);
          });
        } catch (err) {
          console.warn('sendMessage failed', err);
        }
      } else {
        console.log('ACCEPT_INTERRUPT (simulated)');
      }
      // Close the popup window (if running inside an extension this will dismiss the popup)
      try { window.close(); } catch (e) { /* ignore */ }
    });
  } else {
    console.error('Button #acceptInterrupt not found!');
  }

  // Optional extra action for demonstration
  if (otherAction) {
    otherAction.addEventListener('click', () => {
      status.textContent = 'Other action clicked';
      if (hasChrome && chrome.runtime && chrome.runtime.sendMessage) {
        try { chrome.runtime.sendMessage({ type: 'OTHER_ACTION' }); } catch (e) { console.warn(e); }
      }
    });
  }

  // initialize
  tryAuth();
});