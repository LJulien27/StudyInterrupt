// Listener for the open web app button. Opens index.html as a web page.
document.addEventListener("DOMContentLoaded", () => {
    const openWebAppButton = document.getElementById("openWebApp");
    
    // verification
    if (openWebAppButton) { 
        // create web page
        openWebAppButton.addEventListener("click", () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
        });
    } else {
        console.error("Button #openWebApp not found!");
    }
});

/* Commented out listener for the login button */
// document.getElementById("login-btn").addEventListener("click", function() {
//     chrome.runtime.sendMessage({ action: "login" }, function(response) {
//         if (response.success) {
//             console.log("User logged in! Access token:", response.token);
//             document.getElementById("status").textContent = "Logged in!";
//         } else {
//             console.error("Login failed:", response.error);
//             document.getElementById("status").textContent = "Login failed.";
//         }
//     });
// });
