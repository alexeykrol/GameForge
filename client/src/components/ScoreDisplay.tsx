import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <Card className="w-48 bg-gray-800 border-gray-600">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-white text-lg">
          Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400">
            {score.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;
