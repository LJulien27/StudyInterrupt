let appleTabId = null; // Stores the Apple.com tab ID
let timer = null; // Stores the reference to the timeout function
let isTimerActive = false; // Keeps track of whether the timer is running

const interruptTime = 5000; // The interrupt time in miliseconds

// Function to start a 5-second timer
function startTimer() {
    if (isTimerActive) return; // Prevent multiple timers

    isTimerActive = true;
    console.log("Timer started. Will open Apple.com in 5 seconds...");

    timer = setTimeout(() => {
        chrome.tabs.create({ url: "https://www.apple.com" }, (tab) => {
            appleTabId = tab.id; // Store the newly created Apple.com tab ID
            console.log(`Apple tab opened with ID: ${appleTabId}`);
            isTimerActive = false; // Reset flag after opening Apple
        });
    }, interruptTime);
}

// Function to reset the timer when returning to the Apple tab
function resetTimer() {
    if (timer) {
        clearTimeout(timer);
        timer = null;
        isTimerActive = false;
        console.log("Returned to Apple tab. Timer stopped.");
    }
}

// Start the first timer when the extension runs
startTimer();

// Detect when a new tab is activated
chrome.tabs.onActivated.addListener((activeInfo) => {
    const currentTabId = activeInfo.tabId;

    if (currentTabId === appleTabId) {
        // If returning to the Apple tab, reset the timer
        resetTimer();
    } else {
        // If switching away from the Apple tab, start a new timer
        console.log(`Switched to a new tab (ID: ${currentTabId}). Restarting timer.`);
        startTimer();
    }
});
