import { Suspense, useEffect, useState } from "react";
import "@fontsource/inter";
import Match3Game from "./components/Match3Game";

// Main App component
function App() {
  const [showGame, setShowGame] = useState(false);

  // Show the game once everything is loaded
  useEffect(() => {
    setShowGame(true);
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {showGame && (
        <Suspense fallback={<div>Loading...</div>}>
          <Match3Game />
        </Suspense>
      )}
    </div>
  );
}

export default App;
