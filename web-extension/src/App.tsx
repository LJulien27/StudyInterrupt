import React from "react";
import Button from 'react-bootstrap';

function App() {
  const handleClick = () => {
    setTimeout(() => {
      window.open("https://www.google.com", "_blank");

    }, 5000); // 5 seconds delay
  };

  return (
    <div>
      <h1>Hello world</h1>
      <button onClick={handleClick}>Open localhost after 5s</button>
    </div>
  );
}

export default App;
