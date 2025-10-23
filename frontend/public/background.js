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