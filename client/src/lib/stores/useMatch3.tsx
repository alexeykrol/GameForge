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

interface Match3State {
  gameState: (number | null)[][];
  score: number;
  selectedCell: Cell | null;
  animatingCells: Cell[];
  isGameOver: boolean;
  
  // Actions
  initializeGame: () => void;
  handleCellClick: (row: number, col: number) => boolean;
  restartGame: () => void;
  isValidMove: (from: Cell, to: Cell) => boolean;
}

const BOARD_SIZE = 8;

export const useMatch3 = create<Match3State>()(
  subscribeWithSelector((set, get) => ({
    gameState: [],
    score: 0,
    selectedCell: null,
    animatingCells: [],
    isGameOver: false,

    initializeGame: () => {
      const board = createInitialBoard(BOARD_SIZE);
      set({
        gameState: board,
        score: 0,
        selectedCell: null,
        animatingCells: [],
        isGameOver: false
      });
    },

    isValidMove: (from: Cell, to: Cell) => {
      // Check if cells are adjacent
      const rowDiff = Math.abs(from.row - to.row);
      const colDiff = Math.abs(from.col - to.col);
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    },

    handleCellClick: (row: number, col: number) => {
      const state = get();
      const { gameState, selectedCell, isValidMove } = state;
      
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
          // Valid move - process the match
          let currentBoard = newBoard;
          let totalScore = state.score;
          
          // Process all cascading matches
          while (true) {
            const currentMatches = findMatches(currentBoard);
            if (currentMatches.length === 0) break;
            
            // Calculate score for this round of matches
            totalScore += currentMatches.length * 10;
            
            // Remove matched gems
            currentBoard = removeMatches(currentBoard, currentMatches);
            
            // Drop gems down
            currentBoard = dropGems(currentBoard);
            
            // Fill empty spaces with new gems
            currentBoard = fillEmptySpaces(currentBoard);
          }
          
          // Check for game over
          const gameOver = !hasValidMoves(currentBoard);
          
          set({
            gameState: currentBoard,
            score: totalScore,
            selectedCell: null,
            isGameOver: gameOver
          });
          
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

    restartGame: () => {
      const board = createInitialBoard(BOARD_SIZE);
      set({
        gameState: board,
        score: 0,
        selectedCell: null,
        animatingCells: [],
        isGameOver: false
      });
    }
  }))
);
