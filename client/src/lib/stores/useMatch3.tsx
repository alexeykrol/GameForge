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
import { getAnimationConfig, AnimationHelpers } from '../animationConfig';
import { useGame } from './useGame';

export interface Cell {
  row: number;
  col: number;
}

export interface AnimatingGem {
  row: number;
  col: number;
  type: 'disappearing' | 'falling' | 'swapping';
  progress: number;
  fromRow?: number;
  fromCol?: number;
  toRow?: number;
  toCol?: number;
  gemType: number;
}

interface Match3State {
  gameState: (number | null)[][];
  score: number;
  selectedCell: Cell | null;
  animatingGems: AnimatingGem[];
  isAnimating: boolean;
  isProcessing: boolean; // блокирует ввод во время анимаций
  isGameOver: boolean;
  
  // Actions
  initializeGame: () => void;
  handleCellClick: (row: number, col: number) => boolean;
  restartGame: () => void;
  isValidMove: (from: Cell, to: Cell) => boolean;
  updateAnimations: () => void;
  swapGems: (fromCell: Cell, toCell: Cell, checkMatch: boolean) => void;
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
    isProcessing: false,
    isGameOver: false,

    initializeGame: () => {
      // Get current difficulty setting from useGame store
      const gameState = useGame.getState();
      const board = createInitialBoard(BOARD_SIZE, gameState.settings.difficulty);
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
        progress: Math.min(gem.progress + AnimationHelpers.getProgressIncrement(), 1.0)
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
      const { gameState, selectedCell, isValidMove, isProcessing } = state;
      
      // Don't allow clicks during processing (animations)
      if (isProcessing) return false;
      
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
        get().swapGems(selectedCell, { row, col }, true);
        return true;
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
      const gameSettings = useGame.getState().settings;
      currentBoard = boardAfterDrop;
      currentBoard = fillEmptySpaces(currentBoard, gameSettings.difficulty);
      
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
              isProcessing: false,
              isGameOver: gameOver
            });
          }
        }, getAnimationConfig(useGame.getState().settings.disappearSpeed, useGame.getState().settings.fallingSpeed).FALLING_DURATION);
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
            isProcessing: false,
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
      }, getAnimationConfig(useGame.getState().settings.disappearSpeed, useGame.getState().settings.fallingSpeed).DISAPPEAR_DURATION);
    },

    swapGems: (fromCell: Cell, toCell: Cell, checkMatch: boolean) => {
      set({ isProcessing: true, selectedCell: null });
      
      // Create copy of board and perform swap
      const state = get();
      const newBoard = state.gameState.map(row => [...row]);
      const temp = newBoard[fromCell.row][fromCell.col];
      newBoard[fromCell.row][fromCell.col] = newBoard[toCell.row][toCell.col];
      newBoard[toCell.row][toCell.col] = temp;

      // Create swapping animations
      const swappingGems: AnimatingGem[] = [
        {
          row: toCell.row,
          col: toCell.col,
          type: 'swapping',
          progress: 0,
          fromRow: fromCell.row,
          fromCol: fromCell.col,
          toRow: toCell.row,
          toCol: toCell.col,
          gemType: state.gameState[fromCell.row][fromCell.col] || 0
        },
        {
          row: fromCell.row,
          col: fromCell.col,
          type: 'swapping',
          progress: 0,
          fromRow: toCell.row,
          fromCol: toCell.col,
          toRow: fromCell.row,
          toCol: fromCell.col,
          gemType: state.gameState[toCell.row][toCell.col] || 0
        }
      ];

      set({
        gameState: newBoard,
        animatingGems: swappingGems,
        isAnimating: true
      });

      // After swap animation completes
      const settings = useGame.getState().settings;
      setTimeout(() => {
        if (checkMatch) {
          const matches = findMatches(newBoard);
          if (matches.length > 0) {
            // Valid move - start disappearing animation
            get().startDisappearingAnimation(newBoard, matches, state.score);
          } else {
            // Invalid move - swap back
            get().swapGems(toCell, fromCell, false);
          }
        } else {
          // Swap back complete
          set({
            animatingGems: [],
            isAnimating: false,
            isProcessing: false
          });
        }
      }, getAnimationConfig(settings.disappearSpeed, settings.fallingSpeed).SWAP_DURATION);
    },

    restartGame: () => {
      // Get current difficulty setting from useGame store
      const gameSettings = useGame.getState().settings;
      const board = createInitialBoard(BOARD_SIZE, gameSettings.difficulty);
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
