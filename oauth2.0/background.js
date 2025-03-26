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
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "login") {
//         chrome.identity.launchWebAuthFlow({
//             url: "https://accounts.google.com/o/oauth2/auth" +
//                 "?client_id=YOUR_GOOGLE_CLIENT_ID" +
//                 "&response_type=token" +
//                 "&redirect_uri=" + encodeURIComponent(chrome.identity.getRedirectURL()) +
//                 "&scope=" + encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"),
//             interactive: true
//         }, function(responseUrl) {
//             if (chrome.runtime.lastError || !responseUrl) {
//                 sendResponse({ success: false, error: chrome.runtime.lastError });
//                 return;
//             }

//             // Extract access token from URL
//             const urlParams = new URLSearchParams(new URL(responseUrl).hash.substring(1));
//             const accessToken = urlParams.get("access_token");

//             if (accessToken) {
//                 sendResponse({ success: true, token: accessToken });
//             } else {
//                 sendResponse({ success: false, error: "No access token found" });
//             }
//         });

//         return true; // Keeps the message channel open for async response
//     }
// });

