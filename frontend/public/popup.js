
document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("status");

  chrome.identity.getAuthToken({ interactive: false }, async function(token) {
    if (token) {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const user = await res.json();
      status.textContent = `Signed in as ${user.name}`;
    } else {
      status.textContent = "Not signed in";
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
            chrome.tabs.create({ url: chrome.runtime.getURL("public/index.html") });
        });
    } else {
        console.error("Button #openWebApp not found!");
    }
});