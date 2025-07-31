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
  completeMatches: (board: (number | null)[][], matches: Cell[]) => void;
  startDisappearingAnimation: (board: (number | null)[][], matches: Cell[], currentScore: number) => void;
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
      if (state.animatingGems.length === 0) return;

      const updatedGems = state.animatingGems.map(gem => ({
        ...gem,
        progress: Math.min(gem.progress + 0.015, 1.0) // Much slower animation
      }));

      set({ animatingGems: updatedGems });
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
          // Start disappearing animation for matched gems
          const disappearingGems: AnimatingGem[] = matches.map(match => ({
            row: match.row,
            col: match.col,
            type: 'disappearing' as const,
            progress: 0,
            gemType: newBoard[match.row][match.col] || 0
          }));

          set({ 
            gameState: newBoard,
            animatingGems: disappearingGems, 
            isAnimating: true,
            selectedCell: null
          });
          
          // Schedule the completion of matches after animation
          setTimeout(() => {
            get().completeMatches(newBoard, matches);
          }, 1500); // 1.5 seconds for disappearing animation
          
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

    completeMatches: (board: (number | null)[][], matches: Cell[]) => {
      const state = get();
      let currentBoard = [...board.map(row => [...row])];
      let totalScore = state.score;

      // Calculate score for matches
      totalScore += matches.length * 10;
      
      // Remove matched gems
      currentBoard = removeMatches(currentBoard, matches);
      
      // Create falling animation for gems that will drop
      const fallingGems: AnimatingGem[] = [];
      const boardAfterDrop = dropGems(currentBoard);
      
      // Find which gems moved down and create falling animations
      for (let col = 0; col < BOARD_SIZE; col++) {
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
          if (currentBoard[row][col] !== null) {
            // Find where this gem ends up after dropping
            let targetRow = row;
            for (let checkRow = row + 1; checkRow < BOARD_SIZE; checkRow++) {
              if (currentBoard[checkRow][col] === null) {
                targetRow = checkRow;
              } else {
                break;
              }
            }
            
            if (targetRow !== row) {
              fallingGems.push({
                row: targetRow,
                col,
                type: 'falling' as const,
                progress: 0,
                fromRow: row,
                gemType: currentBoard[row][col] || 0
              });
            }
          }
        }
      }
      
      // Apply the drop and fill with new gems
      currentBoard = boardAfterDrop;
      currentBoard = fillEmptySpaces(currentBoard);
      
      if (fallingGems.length > 0) {
        // Start falling animation
        set({
          gameState: currentBoard,
          score: totalScore,
          animatingGems: fallingGems,
          isAnimating: true
        });
        
        // After falling animation, check for more matches
        setTimeout(() => {
          const state = get();
          const moreMatches = findMatches(state.gameState);
          if (moreMatches.length > 0) {
            // Continue with cascading matches
            state.startDisappearingAnimation(state.gameState, moreMatches, state.score);
          } else {
            // No more matches, finish
            const gameOver = !hasValidMoves(state.gameState);
            set({
              animatingGems: [],
              isAnimating: false,
              isGameOver: gameOver
            });
          }
        }, 2000); // Wait for falling animation (2 seconds)
      } else {
        // No falling animation needed, check for more matches immediately
        const moreMatches = findMatches(currentBoard);
        if (moreMatches.length > 0) {
          state.startDisappearingAnimation(currentBoard, moreMatches, totalScore);
        } else {
          const gameOver = !hasValidMoves(currentBoard);
          set({
            gameState: currentBoard,
            score: totalScore,
            animatingGems: [],
            isAnimating: false,
            isGameOver: gameOver
          });
        }
      }
    },

    startDisappearingAnimation: (board: (number | null)[][], matches: Cell[], currentScore: number) => {
      const disappearingGems: AnimatingGem[] = matches.map(match => ({
        row: match.row,
        col: match.col,
        type: 'disappearing' as const,
        progress: 0,
        gemType: board[match.row][match.col] || 0
      }));

      set({ 
        animatingGems: disappearingGems, 
        isAnimating: true,
        score: currentScore
      });
      
      // Schedule the completion of matches after animation
      setTimeout(() => {
        get().completeMatches(board, matches);
      }, 1500);
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
