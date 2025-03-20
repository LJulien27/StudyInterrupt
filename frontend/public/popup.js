document.addEventListener("DOMContentLoaded", () => {
    const openWebAppButton = document.getElementById("openWebApp");
    if (openWebAppButton) {
        openWebAppButton.addEventListener("click", () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
        });
    } else {
        console.error("Button #openWebApp not found!");
    }
});
