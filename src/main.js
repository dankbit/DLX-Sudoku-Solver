import { SudokuDLX } from './dlx.js';
import './style.css';

const app = document.querySelector('#app');

// 1. Change: Define an empty 9x9 grid (0 represents empty)
const EMPTY_BOARD = Array.from({ length: 9 }, () => Array(9).fill(0));

const renderApp = () => {
  app.innerHTML = `
    <div class="min-h-screen bg-neutral-900 text-neutral-200 flex flex-col items-center justify-center p-4 font-mono">
      <h1 class="text-3xl font-bold mb-2 text-emerald-400">DLX Sudoku Solver</h1>
      <p class="text-xs mb-6 text-neutral-400">Sudoku solver using Knuth's Algorithm X and Dancing Links Technique   </p>
      
      <div id="grid-container" class="grid grid-cols-9 gap-[1px] bg-neutral-700 border-2 border-neutral-600 mb-6 shadow-2xl">
        </div>

      <div class="flex gap-4 mb-4">
        <button id="solve-btn" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors">
          SOLVE
        </button>
        <button id="clear-btn" class="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors">
          CLEAR
        </button>
      </div>

      <div id="stats" class="h-6 text-sm text-yellow-400"></div>
    </div>
  `;

  // 2. Change: Initialize with the empty board
  createGrid(EMPTY_BOARD);
  
  document.getElementById('solve-btn').addEventListener('click', handleSolve);
  
  // 3. Change: Clear button resets to empty board
  document.getElementById('clear-btn').addEventListener('click', () => {
      createGrid(EMPTY_BOARD);
      document.getElementById('stats').innerText = '';
  });
};

const createGrid = (board) => {
  const container = document.getElementById('grid-container');
  container.innerHTML = '';

  board.forEach((row, rIndex) => {
    row.forEach((val, cIndex) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      // If val is 0, show empty string. Otherwise show the number.
      input.value = val === 0 ? '' : val; 
      input.dataset.row = rIndex;
      input.dataset.col = cIndex;
      
      let classes = [
        'w-10', 'h-10', 'text-center', 'text-lg', 'bg-neutral-800', 
        'focus:bg-neutral-700', 'focus:outline-none', 'focus:ring-1', 'focus:ring-emerald-500',
        'transition-colors'
      ];

      if ((cIndex + 1) % 3 === 0 && cIndex !== 8) classes.push('border-r-2 border-r-neutral-600');
      if ((rIndex + 1) % 3 === 0 && rIndex !== 8) classes.push('border-b-2 border-b-neutral-600');

      input.className = classes.join(' ');

      // Validation: Only allow numbers 1-9
      input.addEventListener('input', (e) => {
        const v = e.target.value;
        if (!/^[1-9]$/.test(v)) {
          e.target.value = '';
        } else {
          // Visual feedback: User entered numbers look standard (white/grey)
          e.target.classList.remove('text-emerald-400');
        }
      });

      container.appendChild(input);
    });
  });
};

// Reads whatever is currently on the screen
const getGridValues = () => {
  const inputs = document.querySelectorAll('#grid-container input');
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  
  inputs.forEach(input => {
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    const val = parseInt(input.value) || 0;
    grid[r][c] = val;
  });
  return grid;
};

const updateGrid = (solvedGrid) => {
  const inputs = document.querySelectorAll('#grid-container input');
  inputs.forEach(input => {
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    
    // Only fill in empty spots so we preserve user input styling
    if (!input.value) {
        input.value = solvedGrid[r][c];
        // Highlight the algorithm's solution numbers in green
        input.classList.add('text-emerald-400'); 
    }
  });
};

const handleSolve = () => {
  const grid = getGridValues(); // <--- This grabs your manual inputs
  const solver = new SudokuDLX();
  
  solver.initialize(grid);

  const start = performance.now();
  const result = solver.solve();
  const end = performance.now();

  const timeTaken = (end - start).toFixed(4);

  if (result) {
    updateGrid(result);
    document.getElementById('stats').innerText = `Solved in ${timeTaken} ms`;
  } else {
    // This happens if you input conflicting numbers (e.g. two 5s in a row)
    document.getElementById('stats').innerText = `No solution found (Invalid inputs)`;
  }
};

renderApp();