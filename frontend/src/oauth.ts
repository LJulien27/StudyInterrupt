export async function initOAuth() {

  async function authenticate(interactive: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    // Guard: only run inside extension
    if (typeof chrome === "undefined" || !chrome.identity || !chrome.identity.getAuthToken) {
      reject(new Error("Chrome identity API not available"));
      return;
    }
    // depending on a user's chrome browser version, the result of getAuthToken can have a varied shape, which can cause issues
    chrome.identity.getAuthToken(
      { interactive },
      // 'result' can be string or { token: string } oe undefined, so type as 'any'
      // handle possible issues by resolving type to string:
      (result: any) => {
        let token: string | undefined;

        // Handle both possible shapes:
        if (typeof result === "string") {
          token = result;
        } else if (result && typeof result.token === "string") {
          token = result.token;
        }

        if (chrome.runtime.lastError || !token) {
          // No token (or error)
          if (!interactive && chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            reject(
              chrome.runtime.lastError ??
              new Error("User did not log in or no token available")
            );
          }
        } else {
          resolve(token);
        }
      }
    );
  });
}

  // Get username, password, etc.
  async function fetchUserInfo(token : string): Promise<any> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });
    return res.json();
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

    } catch (e: any) {
      // If no cached token and user is not in localStorage, silently fail
      // The user can authenticate via popup.js if needed
      // Only log if it's not a "user cancelled" or "not logged in" error
      if (e?.message && !e.message.includes("User did not log in") && !e.message.includes("OAuth2")) {
        console.log("Authentication check failed:", e?.message || e);
      }
      // Don't try interactive login here - let popup.js handle it
      // This prevents error when user is already logged in via popup
    }
  }

  init();
};