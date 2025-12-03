// dlx.js

/**
 * Node class for the Toroidal Doubly Linked List
 */
class Node {
  constructor(columnNode = null) {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.column = columnNode; // Pointer to the column header
    this.rowIndex = -1;       // ID to map back to Sudoku (0-728)
  }
}

class ColumnNode extends Node {
  constructor(name) {
    super();
    this.size = 0; // Optimization: choose column with min size
    this.name = name;
    this.column = this;
  }
}

export class SudokuDLX {
  constructor() {
    this.header = new ColumnNode("header");
    this.nodes = []; // To track nodes for garbage collection if needed
    this.solution = [];
    this.resultGrid = [];
  }

  // 1. Initialize the Exact Cover Matrix for Sudoku
  initialize(initialGrid) {
    this.header = new ColumnNode("header");
    this.solution = [];
    this.resultGrid = JSON.parse(JSON.stringify(initialGrid)); // Deep copy

    // Create 324 Column Headers
    // 0-80: Cell filled, 81-161: Row has Num, 162-242: Col has Num, 243-323: Box has Num
    let columns = [];
    for (let i = 0; i < 324; i++) {
      let col = new ColumnNode(i);
      this.linkRight(this.header.left, col);
      columns.push(col);
    }

    // Create Rows (Candidates)
    // 9 rows * 9 cols * 9 nums = 729 possibilities
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        let val = initialGrid[r][c];
        
        // If cell is pre-filled, we only create the row for that specific value
        // If empty (0), we create rows for values 1-9
        let start = val === 0 ? 1 : val;
        let end = val === 0 ? 9 : val;

        for (let num = start; num <= end; num++) {
          // Calculate constraint indices
          let boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
          
          let idx1 = r * 9 + c;              // Constraint: Cell (r,c) has a value
          let idx2 = 81 + r * 9 + (num - 1); // Constraint: Row r has value num
          let idx3 = 162 + c * 9 + (num - 1);// Constraint: Col c has value num
          let idx4 = 243 + boxIdx * 9 + (num - 1); // Constraint: Box b has value num

          // Create the row in the matrix
          this.addMatrixRow(columns, [idx1, idx2, idx3, idx4], { r, c, num });
        }
      }
    }
  }

  // Helper: Link a new node to the right of 'leftNode'
  linkRight(leftNode, newNode) {
    newNode.right = leftNode.right;
    newNode.right.left = newNode;
    leftNode.right = newNode;
    newNode.left = leftNode;
  }

  // Helper: Link a new node to the bottom of 'upNode'
  linkDown(upNode, newNode) {
    newNode.down = upNode.down;
    newNode.down.up = newNode;
    upNode.down = newNode;
    newNode.up = upNode;
    upNode.column.size++;
  }

  addMatrixRow(columns, indices, data) {
    let prevNode = null;
    
    // Create a node for each of the 4 constraints satisfied by this candidate
    for (let i = 0; i < indices.length; i++) {
      let colNode = columns[indices[i]];
      let newNode = new Node(colNode);
      newNode.data = data; // Store {r, c, num}

      // Link Vertical
      this.linkDown(colNode.up, newNode);

      // Link Horizontal
      if (prevNode) {
        this.linkRight(prevNode, newNode);
      } else {
        // First node creates the circular row structure logic (points to self initially)
        // Handled by constructor, but we need to ensure circularity if size > 1 later
      }
      prevNode = newNode;
    }
  }

  // --- CORE DLX OPERATIONS ---

  // "Cover" a column: Remove it from the header list and remove all rows in its list from other columns
  cover(colNode) {
    colNode.right.left = colNode.left;
    colNode.left.right = colNode.right;

    for (let i = colNode.down; i !== colNode; i = i.down) {
      for (let j = i.right; j !== i; j = j.right) {
        j.down.up = j.up;
        j.up.down = j.down;
        j.column.size--;
      }
    }
  }

  // "Uncover": Put everything back exactly as it was (Reverse Order)
  uncover(colNode) {
    for (let i = colNode.up; i !== colNode; i = i.up) {
      for (let j = i.left; j !== i; j = j.left) {
        j.column.size++;
        j.down.up = j;
        j.up.down = j;
      }
    }
    colNode.right.left = colNode;
    colNode.left.right = colNode;
  }

  // Knuth's Algorithm X Recursive Search
  search() {
    // Base Case: If header.right is header, matrix is empty => Solution Found
    if (this.header.right === this.header) {
      return true;
    }

    // Heuristic: Choose column with smallest size (Deterministically minimizes branching factor)
    let c = this.header.right;
    for (let temp = c.right; temp !== this.header; temp = temp.right) {
      if (temp.size < c.size) c = temp;
    }

    this.cover(c);

    for (let r = c.down; r !== c; r = r.down) {
      this.solution.push(r.data); // Record step

      for (let j = r.right; j !== r; j = j.right) {
        this.cover(j.column);
      }

      if (this.search()) return true;

      // Backtrack
      r = this.solution.pop();
      let rowNode = c.down; // We need to find the node object again to uncover rows
      // Actually, 'r' here is the node iterator, so we just continue
      
      for (let j = r.left; j !== r; j = j.left) {
        this.uncover(j.column);
      }
    }

    this.uncover(c);
    return false;
  }

  solve() {
    if (this.search()) {
      // Map solution back to grid
      this.solution.forEach(({ r, c, num }) => {
        this.resultGrid[r][c] = num;
      });
      return this.resultGrid;
    }
    return null;
  }
}