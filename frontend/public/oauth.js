
window.onload = function() {
  const friendDiv = document.getElementById('contactsDiv');

  async function authenticate(interactive) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, function(token) {
        if (chrome.runtime.lastError || !token) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }

  async function fetchUserProfile(token) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });
    return response.json();
  }

  async function init() {
    try {
      // Try to get a cached token in the background
      const token = await authenticate(false);
      const profile = await fetchUserProfile(token);
      friendDiv.innerHTML = `<p>Welcome, ${profile.name} (${profile.email})</p>`;
    } catch (e) {
      // If no cached token, make user sign in interactively
      friendDiv.innerHTML = `<p>Not signed in.</p>`;
      console.log("No cached token found — opening login popup...");
      try {
        const token = await authenticate(true);
        const profile = await fetchUserProfile(token);
        friendDiv.innerHTML = `<p>Welcome, ${profile.name} (${profile.email})</p>`;
      } catch (err) {
        friendDiv.innerHTML = `<p>Login failed: ${err?.message || "unknown error"}</p>`;
        console.error("Login failed:", err);
      }
    }
  }

  init();
};



// // load script with web page
// window.onload = function() {
//   // Oauth2.0 authentication:
//   document.querySelector('button').addEventListener('click', function() {
//     // retreive token
//     chrome.identity.getAuthToken({interactive: true}, function(token) {
//       let init = {
//         method: 'GET',
//         async: true,
//         headers: {
//           Authorization: 'Bearer ' + token,
//           'Content-Type': 'application/json'
//         },
//         'contentType': 'json'
//       };
//       fetch(
//           'https://people.googleapis.com/v1/contactGroups/all?maxMembers=20', init)
//           .then((response) => response.json())
//           .then(function(data) {
//             console.log(data)
//           });
//     });
//   });
// };
