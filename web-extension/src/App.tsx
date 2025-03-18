import { useState } from "react";

declare const chrome: any;


function App() {
  const [timerLength, setTimerLength] = useState(5); // Default 5 seconds

  // Function to send the selected timer length to background.js
  
  const updateTimer = () => {
    chrome.runtime.sendMessage(
      { type: "SET_TIMER", payload: timerLength },
      (response: { status: string } | undefined) => {
        if (response) {
          console.log("Background response:", response.status);
        } else {
          console.log("No response from background script.");
        }
      }
    );
    
  };
  

  return (
    <div>
      <h1>Set Timer Length in seconds</h1>
      <input
        type="number"
        value={timerLength}
        onChange={(e) => setTimerLength(Number(e.target.value))}
      />
      <button onClick={updateTimer} >Set Timer</button>
    </div>
  );
}

export default App;
