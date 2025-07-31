import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  createInitialBoard, 
  findMatches, 
  removeMatches, 
  dropGems, 
  fillEmptySpaces,
  hasValidMoves 
} from '../gameLogic';

export interface Cell {
  row: number;
  col: number;
}

export interface AnimatingGem {
  row: number;
  col: number;
  type: 'disappearing' | 'falling';
  progress: number;
  fromRow?: number;
  gemType: number;
}

interface Match3State {
  gameState: (number | null)[][];
  score: number;
  selectedCell: Cell | null;
  animatingGems: AnimatingGem[];
  isAnimating: boolean;
  isGameOver: boolean;
  
  // Actions
  initializeGame: () => void;
  handleCellClick: (row: number, col: number) => boolean;
  restartGame: () => void;
  isValidMove: (from: Cell, to: Cell) => boolean;
  updateAnimations: () => void;
  processAnimatedMatches: (board: (number | null)[][], matches: Cell[]) => Promise<void>;
}

const BOARD_SIZE = 8;

export const useMatch3 = create<Match3State>()(
  subscribeWithSelector((set, get) => ({
    gameState: [],
    score: 0,
    selectedCell: null,
    animatingGems: [],
    isAnimating: false,
    isGameOver: false,

    initializeGame: () => {
      const board = createInitialBoard(BOARD_SIZE);
      set({
        gameState: board,
        score: 0,
        selectedCell: null,
        animatingGems: [],
        isAnimating: false,
        isGameOver: false
      });
    },

    updateAnimations: () => {
      const state = get();
      const updatedGems = state.animatingGems.map(gem => ({
        ...gem,
        progress: Math.min(gem.progress + 0.05, 1.0)
      })).filter(gem => gem.progress < 1.0);

      if (updatedGems.length !== state.animatingGems.length) {
        // Some animations finished
        set({
          animatingGems: updatedGems,
          isAnimating: updatedGems.length > 0
        });
      } else if (updatedGems.length > 0) {
        set({ animatingGems: updatedGems });
      }
    },

    isValidMove: (from: Cell, to: Cell) => {
      // Check if cells are adjacent
      const rowDiff = Math.abs(from.row - to.row);
      const colDiff = Math.abs(from.col - to.col);
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    },

    handleCellClick: (row: number, col: number) => {
      const state = get();
      const { gameState, selectedCell, isValidMove, isAnimating } = state;
      
      // Don't allow clicks during animations
      if (isAnimating) return false;
      
      // If no cell is selected, select this one
      if (!selectedCell) {
        set({ selectedCell: { row, col } });
        return false;
      }
      
      // If clicking the same cell, deselect
      if (selectedCell.row === row && selectedCell.col === col) {
        set({ selectedCell: null });
        return false;
      }
      
      // If clicking an adjacent cell, try to swap
      if (isValidMove(selectedCell, { row, col })) {
        const newBoard = gameState.map(row => [...row]);
        
        // Swap gems
        const temp = newBoard[selectedCell.row][selectedCell.col];
        newBoard[selectedCell.row][selectedCell.col] = newBoard[row][col];
        newBoard[row][col] = temp;
        
        // Check if this creates any matches
        const matches = findMatches(newBoard);
        
        if (matches.length > 0) {
          // Start animated sequence
          state.processAnimatedMatches(newBoard, matches);
          set({ selectedCell: null });
          return true;
        } else {
          // Invalid move - revert the swap
          set({ selectedCell: null });
          return false;
        }
      } else {
        // Not adjacent - select the new cell
        set({ selectedCell: { row, col } });
        return false;
      }
    },

    processAnimatedMatches: async (board: (number | null)[][], matches: Cell[]) => {
      const state = get();
      let currentBoard = [...board.map(row => [...row])];
      let totalScore = state.score;

      // Start disappearing animation for matched gems
      const disappearingGems: AnimatingGem[] = matches.map(match => ({
        row: match.row,
        col: match.col,
        type: 'disappearing' as const,
        progress: 0,
        gemType: currentBoard[match.row][match.col] || 0
      }));

      set({ 
        animatingGems: disappearingGems, 
        isAnimating: true,
        gameState: currentBoard 
      });

      // Wait for disappearing animation to complete
      await new Promise(resolve => {
        const checkProgress = () => {
          const state = get();
          const allFinished = state.animatingGems.every(gem => gem.progress >= 1.0);
          if (allFinished) {
            resolve(void 0);
          } else {
            requestAnimationFrame(checkProgress);
          }
        };
        checkProgress();
      });

      // Process cascading matches with animation
      while (true) {
        const currentMatches = findMatches(currentBoard);
        if (currentMatches.length === 0) break;
        
        totalScore += currentMatches.length * 10;
        currentBoard = removeMatches(currentBoard, currentMatches);
        
        // Animate falling gems
        const fallingGems: AnimatingGem[] = [];
        const newBoard = dropGems(currentBoard);
        
        // Find gems that moved and create falling animations
        for (let col = 0; col < BOARD_SIZE; col++) {
          for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            if (currentBoard[row][col] !== null && newBoard[row][col] === null) {
              // Find where this gem ended up
              for (let newRow = row + 1; newRow < BOARD_SIZE; newRow++) {
                if (newBoard[newRow][col] === currentBoard[row][col]) {
                  fallingGems.push({
                    row: newRow,
                    col,
                    type: 'falling' as const,
                    progress: 0,
                    fromRow: row,
                    gemType: currentBoard[row][col] || 0
                  });
                  break;
                }
              }
            }
          }
        }
        
        currentBoard = newBoard;
        currentBoard = fillEmptySpaces(currentBoard);
        
        if (fallingGems.length > 0) {
          set({ 
            animatingGems: fallingGems,
            gameState: currentBoard 
          });
          
          // Wait for falling animation
          await new Promise(resolve => {
            const checkProgress = () => {
              const state = get();
              const allFinished = state.animatingGems.every(gem => gem.progress >= 1.0);
              if (allFinished) {
                resolve(void 0);
              } else {
                requestAnimationFrame(checkProgress);
              }
            };
            checkProgress();
          });
        }
      }

      // Check for game over
      const gameOver = !hasValidMoves(currentBoard);
      
      set({
        gameState: currentBoard,
        score: totalScore,
        animatingGems: [],
        isAnimating: false,
        isGameOver: gameOver
      });
    },

    restartGame: () => {
      const board = createInitialBoard(BOARD_SIZE);
      set({
        gameState: board,
        score: 0,
        selectedCell: null,
        animatingGems: [],
        isAnimating: false,
        isGameOver: false
      });
    }
  }))
);
