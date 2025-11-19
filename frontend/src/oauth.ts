export async function initOAuth() {
  /*const contactsDiv = document.getElementById('contactsDiv');
    if (!contactsDiv) {
      console.warn("contactsDiv element not found");
      return;
    }
  */
  async function authenticate(interactive : boolean): Promise<string>{
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, function(result) {
        const token = result?.token;
        if (chrome.runtime.lastError || !token) {
          reject(chrome.runtime.lastError);
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
    try {
      // Try to get a cached token in the background
      const token = await authenticate(false);
      //const profile = await fetchUserProfile(token);
      //contactsDiv!.innerHTML = `<p>Welcome, ${profile.name} (${profile.email})</p>`;
    } catch (e) {
      // If no cached token, make user sign in interactively
      //contactsDiv!.innerHTML = `<p>Not signed in.</p>`;
      console.log("No cached token found — opening login popup...");
      try {
        const token = await authenticate(true);
        const user = await fetchUserInfo(token);
        const res = await fetch('https://studyinterruptbackend.onrender.com/users/exists/' + user.sub)
          if (res.status === 404) {
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
          } else if (!res.ok) {
            // Other errors (500, CORS, etc.)
            throw new Error(`Server error: ${res.status}`);
          }
        const profile = await fetchUserProfile(token);
        //contactsDiv!.innerHTML = `<p>Welcome, ${profile.name} (${profile.email})</p>`;
      } catch (err: any) {
        //contactsDiv!.innerHTML = `<p>Login failed: ${err?.message || "unknown error"}</p>`;
        console.error("Login failed:", err);
      }
    }
  }

  init();
};