export async function initOAuth() {
  /*const contactsDiv = document.getElementById('contactsDiv');
    if (!contactsDiv) {
      console.warn("contactsDiv element not found");
      return;
    }
  */
  async function authenticate(interactive : boolean): Promise<string>{
    return new Promise((resolve, reject) => {
      // Check if chrome.identity is available (Chrome extension API)
      if (typeof chrome === 'undefined' || !chrome.identity) {
        reject(new Error("Chrome identity API not available"));
        return;
      }
      
      chrome.identity.getAuthToken({ interactive }, function(result) {
        const token = result?.token;
        if (chrome.runtime.lastError || !token) {
          // Don't throw error if user cancelled or if not interactive
          if (!interactive && chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            reject(chrome.runtime.lastError ?? new Error("User did not log in"));
          }
        } else {
          resolve(token);
        }
      });
    });
  }

  async function fetchUserInfo(token : string): Promise<any> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });
    return res.json();
  }

  async function fetchUserProfile(token : string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });
    return response.json();
  }

  async function init() {
    // First, check if user is already in localStorage (from popup.js or previous session)
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Verify the user still exists on the backend
        if (user.google_id) {
          const res = await fetch('https://studyinterruptbackend.onrender.com/users/exists/' + user.google_id);
          if (res.ok) {
            const userData = await res.json();
            localStorage.setItem("user", JSON.stringify(userData));
            window.dispatchEvent(new Event("userUpdated"));
            console.log("User already logged in from localStorage");
            return; // User is already logged in, no need to authenticate
          }
        }
      } catch (e) {
        console.log("Error parsing saved user, will re-authenticate:", e);
        // Continue to authentication if saved user is invalid
      }
    }

    // If no valid user in localStorage, try to authenticate
    try {
      // Try to get a cached token in the background
      const token = await authenticate(false);
      const user = await fetchUserInfo(token);
      const res = await fetch('https://studyinterruptbackend.onrender.com/users/exists/' + user.sub);
      
      if (res.status === 404) {
        // User doesn't exist, create new user
        console.log("Creating user: ", user.sub);
        const now = new Date().toISOString();
        let userObject = {
          username: user.name,
          email: user.email,
          google_id: user.sub,
          created_at: now,
        };
        console.log(userObject); // Debugging
        let response = await fetch('https://studyinterruptbackend.onrender.com/users',
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userObject)
          }
        ); 
        const data = await response.json();
        console.log(data);
        localStorage.setItem("user", JSON.stringify(data));
        // Notify AuthContext that user was updated
        window.dispatchEvent(new Event("userUpdated"));
      } else if (res.ok) {
        // User exists, get the user data and save to localStorage
        const userData = await res.json();
        console.log("User already exists:", userData);
        localStorage.setItem("user", JSON.stringify(userData));
        // Notify AuthContext that user was updated
        window.dispatchEvent(new Event("userUpdated"));
      } else {
        // Other errors (500, CORS, etc.)
        throw new Error(`Server error: ${res.status}`);
      }

      //const profile = await fetchUserProfile(token);
      //contactsDiv!.innerHTML = `<p>Welcome, ${profile.name} (${profile.email})</p>`;
    } catch (e: any) {
      // If no cached token and user is not in localStorage, silently fail
      // The user can authenticate via popup.js if needed
      // Only log if it's not a "user cancelled" or "not logged in" error
      if (e?.message && !e.message.includes("User did not log in") && !e.message.includes("OAuth2")) {
        console.log("Authentication check failed:", e?.message || e);
      }
      // Don't try interactive login here - let popup.js handle it
      // This prevents the error from showing when user is already logged in via popup
    }
  }

  init();
};