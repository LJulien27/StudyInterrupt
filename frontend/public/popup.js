
document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("status");

  async function fetchUserInfo(token) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });
    return res.json();
  }

  // Try to get cached token first
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError || !token) {
      console.log("No cached token, prompting user interactively...");

      // Fallback to interactive login
      chrome.identity.getAuthToken({ interactive: true }, async (newToken) => {
        if (chrome.runtime.lastError || !newToken) {
          console.error("Login failed:", chrome.runtime.lastError);
          status.textContent = "Not signed in";
          return;
        }
        try {
          const user = await fetchUserInfo(newToken);
          status.textContent = `Signed in as ${user.name}`;
          const res = await fetch('https://studyinterruptbackend.onrender.com/users/exists/' + user.sub).then(r => r.json())
          if (res.status === 404) {
            console.log("Creating user: ", user.sub);
            const now = new Date();
            let userObject = {
              username: user.name,
              email: user.email,
              googleid: user.sub,
              createdat: now,
            };
            console.log(userObject); // Debugging
            let response = await fetch('https://studyinterruptbackend.onrender.com/users/',
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userObject)
              }
            );
            const data = await response.json();
            console.log(data);
          } else if (!res.ok) {
            // Other errors (500, CORS, etc.)
            throw new Error(`Server error: ${res.status}`);
          }
        } catch (err) {
          console.error("Error fetching user info:", err);
          status.textContent = "Error fetching profile";
        }
      });
    } else {
      // Cached token exists
      (async () => {
        try {
          const user = await fetchUserInfo(token);
          status.textContent = `Signed in as ${user.name}`;
        } catch (err) {
          console.error("Error fetching user info:", err);
          status.textContent = "Error fetching profile";
        }
      })();
    }
  });
});



// Listener for the open web app button. Opens index.html as a web page.
document.addEventListener("DOMContentLoaded", () => {
    const openWebAppButton = document.getElementById("openWebApp");
    
    // verification
    if (openWebAppButton) { 
        // create web page
        openWebAppButton.addEventListener("click", () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("build/index.html") });
        });
    } else {
        console.error("Button #openWebApp not found!");
    }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (!token) {
      console.log("No token found to logout.");
      return;
    }

    // Step 1: Revoke token with Google
    fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
      .then(() => {
        console.log("Google token revoked.");

        // Step 2: Remove token from Chrome cache
        chrome.identity.removeCachedAuthToken({ token }, () => {
          console.log("Token removed from Chrome.");

          // Step 3 (optional): Clear from your backend if needed
          // fetch('https://your-backend.com/logout', { method: 'POST' });

          // Step 4: Update UI
          const status = document.getElementById("status");
          if (status) status.textContent = "Logged out";
        });
      })
      .catch((err) => console.error("Logout error:", err));
  });
});
