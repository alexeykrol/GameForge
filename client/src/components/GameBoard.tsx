import React, { useRef, useEffect, useCallback } from 'react';
import { useMatch3 } from '../lib/stores/useMatch3';
import { useAudio } from '../lib/stores/useAudio';
import { ParticleSystem } from '../lib/particleSystem';

const BOARD_SIZE = 8;
const CELL_SIZE = 50;
const BOARD_WIDTH = BOARD_SIZE * CELL_SIZE;
const BOARD_HEIGHT = BOARD_SIZE * CELL_SIZE;

// Gem colors with nice gradients
const GEM_COLORS = [
  '#ff4757', // Red
  '#2ed573', // Green  
  '#3742fa', // Blue
  '#ffa502', // Orange
  '#a55eea', // Purple
  '#26d0ce', // Cyan
  '#fd79a8', // Pink
];

const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particleSystemRef = useRef<ParticleSystem>();
  
  const { 
    gameState, 
    selectedCell, 
    animatingCells,
    handleCellClick,
    isValidMove
  } = useMatch3();
  
  const { playHit, playSuccess } = useAudio();

  // Initialize particle system
  useEffect(() => {
    if (canvasRef.current) {
      particleSystemRef.current = new ParticleSystem(canvasRef.current);
    }
  }, []);

  const drawGem = useCallback((
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    color: string, 
    scale: number = 1
  ) => {
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    const radius = (CELL_SIZE * 0.35) * scale;

    // Create gradient
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, 
      centerY - radius * 0.3, 
      0,
      centerX, 
      centerY, 
      radius
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, '#000000');

    // Draw gem shape (hexagon)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const gemX = centerX + radius * Math.cos(angle);
      const gemY = centerY + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(gemX, gemY);
      } else {
        ctx.lineTo(gemX, gemY);
      }
    }
    ctx.closePath();
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    
    // Add highlight
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.3, 
      centerY - radius * 0.3, 
      radius * 0.2 * scale, 
      0, 
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if gameState is properly initialized
    if (!gameState || gameState.length === 0) return;

    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Draw grid background
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, BOARD_HEIGHT);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw gems
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        // Safety check for row existence
        if (!gameState[row]) continue;
        
        const gemType = gameState[row][col];
        if (gemType !== null) {
          const x = col * CELL_SIZE;
          const y = row * CELL_SIZE;
          
          // Check if this cell is selected
          const isSelected = selectedCell && 
            selectedCell.row === row && 
            selectedCell.col === col;
          
          // Check if this cell is animating
          const isAnimating = animatingCells.some(
            cell => cell.row === row && cell.col === col
          );
          
          const scale = isSelected ? 1.1 : isAnimating ? 0.9 : 1;
          const color = GEM_COLORS[gemType];
          
          drawGem(ctx, x, y, color, scale);
          
          // Draw selection highlight
          if (isSelected) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          }
        }
      }
    }

    // Update and draw particles
    if (particleSystemRef.current) {
      particleSystemRef.current.update();
      particleSystemRef.current.draw(ctx);
    }
  }, [gameState, selectedCell, animatingCells, drawGem]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if gameState is properly initialized
    if (!gameState || gameState.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && gameState[row]) {
      const success = handleCellClick(row, col);
      
      if (success) {
        playSuccess();
        // Add particles for successful match
        if (particleSystemRef.current) {
          particleSystemRef.current.addExplosion(
            col * CELL_SIZE + CELL_SIZE / 2,
            row * CELL_SIZE + CELL_SIZE / 2,
            GEM_COLORS[gameState[row][col] || 0]
          );
        }
      } else {
        playHit();
      }
    }
  };

  // Touch support
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if gameState is properly initialized
    if (!gameState || gameState.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && gameState[row]) {
      const success = handleCellClick(row, col);
      
      if (success) {
        playSuccess();
        if (particleSystemRef.current) {
          particleSystemRef.current.addExplosion(
            col * CELL_SIZE + CELL_SIZE / 2,
            row * CELL_SIZE + CELL_SIZE / 2,
            GEM_COLORS[gameState[row][col] || 0]
          );
        }
      } else {
        playHit();
      }
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-2xl">
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH}
        height={BOARD_HEIGHT}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        className="border-2 border-gray-600 rounded cursor-pointer touch-none"
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

export default GameBoard;
