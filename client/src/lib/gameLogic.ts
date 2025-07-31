export interface Cell {
  row: number;
  col: number;
}

export interface Match {
  cells: Cell[];
  type: number;
}

const GEM_TYPES = 7;

/**
 * Creates an initial board with no immediate matches
 */
export function createInitialBoard(size: number): (number | null)[][] {
  const board: (number | null)[][] = [];
  
  for (let row = 0; row < size; row++) {
    board[row] = [];
    for (let col = 0; col < size; col++) {
      let gemType;
      do {
        gemType = Math.floor(Math.random() * GEM_TYPES);
      } while (
        // Avoid horizontal matches
        (col >= 2 && 
         board[row][col - 1] === gemType && 
         board[row][col - 2] === gemType) ||
        // Avoid vertical matches
        (row >= 2 && 
         board[row - 1][col] === gemType && 
         board[row - 2][col] === gemType)
      );
      
      board[row][col] = gemType;
    }
  }
  
  return board;
}

/**
 * Finds all matches of 3 or more gems in a row or column
 */
export function findMatches(board: (number | null)[][]): Cell[] {
  const matches: Cell[] = [];
  const size = board.length;
  
  // Check horizontal matches
  for (let row = 0; row < size; row++) {
    let count = 1;
    let currentType = board[row][0];
    
    for (let col = 1; col < size; col++) {
      if (board[row][col] === currentType && currentType !== null) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = col - count; i < col; i++) {
            matches.push({ row, col: i });
          }
        }
        count = 1;
        currentType = board[row][col];
      }
    }
    
    // Check the last sequence
    if (count >= 3) {
      for (let i = size - count; i < size; i++) {
        matches.push({ row, col: i });
      }
    }
  }
  
  // Check vertical matches
  for (let col = 0; col < size; col++) {
    let count = 1;
    let currentType = board[0][col];
    
    for (let row = 1; row < size; row++) {
      if (board[row][col] === currentType && currentType !== null) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = row - count; i < row; i++) {
            matches.push({ row: i, col });
          }
        }
        count = 1;
        currentType = board[row][col];
      }
    }
    
    // Check the last sequence
    if (count >= 3) {
      for (let i = size - count; i < size; i++) {
        matches.push({ row: i, col });
      }
    }
  }
  
  return matches;
}

/**
 * Removes matched gems from the board
 */
export function removeMatches(
  board: (number | null)[][], 
  matches: Cell[]
): (number | null)[][] {
  const newBoard = board.map(row => [...row]);
  
  matches.forEach(({ row, col }) => {
    newBoard[row][col] = null;
  });
  
  return newBoard;
}

/**
 * Drops gems down to fill empty spaces
 */
export function dropGems(board: (number | null)[][]): (number | null)[][] {
  const newBoard = board.map(row => [...row]);
  const size = board.length;
  
  for (let col = 0; col < size; col++) {
    let writeIndex = size - 1;
    
    for (let row = size - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        newBoard[writeIndex][col] = newBoard[row][col];
        if (writeIndex !== row) {
          newBoard[row][col] = null;
        }
        writeIndex--;
      }
    }
  }
  
  return newBoard;
}

/**
 * Fills empty spaces with new random gems
 */
export function fillEmptySpaces(board: (number | null)[][]): (number | null)[][] {
  const newBoard = board.map(row => [...row]);
  const size = board.length;
  
  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size; row++) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = Math.floor(Math.random() * GEM_TYPES);
      }
    }
  }
  
  return newBoard;
}

/**
 * Checks if there are any valid moves available
 */
export function hasValidMoves(board: (number | null)[][]): boolean {
  const size = board.length;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Try swapping with right neighbor
      if (col < size - 1) {
        const testBoard = board.map(r => [...r]);
        const temp = testBoard[row][col];
        testBoard[row][col] = testBoard[row][col + 1];
        testBoard[row][col + 1] = temp;
        
        if (findMatches(testBoard).length > 0) {
          return true;
        }
      }
      
      // Try swapping with bottom neighbor
      if (row < size - 1) {
        const testBoard = board.map(r => [...r]);
        const temp = testBoard[row][col];
        testBoard[row][col] = testBoard[row + 1][col];
        testBoard[row + 1][col] = temp;
        
        if (findMatches(testBoard).length > 0) {
          return true;
        }
      }
    }
  }
  
  return false;
}
