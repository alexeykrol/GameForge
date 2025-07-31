import React, { useRef, useEffect, useState } from 'react';
import { useMatch3 } from '../lib/stores/useMatch3';
import { useAudio } from '../lib/stores/useAudio';
import GameBoard from './GameBoard';
import ScoreDisplay from './ScoreDisplay';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Match3Game: React.FC = () => {
  const { 
    gameState, 
    score, 
    isGameOver, 
    initializeGame, 
    restartGame 
  } = useMatch3();
  
  const { playSuccess, playHit } = useAudio();
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (isGameOver && !showGameOver) {
      setShowGameOver(true);
    }
  }, [isGameOver, showGameOver]);

  const handleRestart = () => {
    setShowGameOver(false);
    restartGame();
    playSuccess();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          💎 Match-3 Gems 💎
        </h1>
        <p className="text-lg text-gray-300 text-center">
          Swap adjacent gems to create matches of 3 or more!
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="order-2 lg:order-1">
          <ScoreDisplay score={score} />
          <div className="mt-4">
            <Button 
              onClick={handleRestart}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
            >
              Restart Game
            </Button>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <GameBoard />
        </div>
      </div>

      {showGameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 mx-4 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-center text-white">
                Game Over!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-4">
                No more moves available!
              </p>
              <p className="text-2xl font-bold text-yellow-400 mb-6">
                Final Score: {score}
              </p>
              <Button 
                onClick={handleRestart}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Match3Game;
