// React Nonogram, by Sean Bolton
//
// A puzzle game in the vein of Griddlers, Picross, Picma, or Fugazo World
// Mosaics. See https://en.wikipedia.org/wiki/Nonogram
//
// Copyright © 2017 Sean Bolton.
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Component hierarchy and rough wireframe:
//
//   Game--------------------------------+
//   |  Puzzle-------+-----------------+ |
//   |  |            |     10x Clue    | |
//   |  +------------+-----------------+ |
//   |  |            |                 | |
//   |  |  10x Clue  |  10x10: Square  | |
//   |  |            |                 | |
//   |  +------------+-----------------+ |
//   |                                   |
//   |  Score   Undo  NewGame  AutoFill  |
//   +-----------------------------------+
//
// All state is contained by the `Game` component, and consists of the following
// items:
//
//    autoFill -- true if the game logic should automatically mark all spaces in
//                a row or column once all occupied squares have been guessed.
//    mistakes -- integer, count of the number of incorrect guesses the user has
//                made, initially 0.
//    puzzle -- Array of 100 booleans, in row-major order, values are true for
//                occupied squares.
//    guesses -- Array of 100 tri-state values:
//                  false: no guess has been made,
//                  'o': a correct guess was made,
//                  'x': an incorrect guess was made.
//                Initially all false.
//    undo -- an Array of Arrays, each sub-array contains the indices (into
//                `puzzle` and 'guesses') of the squares that changed for that
//                respective move. (When `autoFill` is true, multiple squares
//                can change per move.) Initially an empty Array.

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

/* ---------- Subcomponents ---------- */

function Clue(props) {
  let puzzle, guesses, separator, className;
  if (props.orientation === 'row') { // a row clue
    puzzle = Array.from(Array(10), (_, col) => props.puzzle[toIndex(props.index, col)]);
    guesses = Array.from(Array(10), (_, col) => props.guesses[toIndex(props.index, col)]);
    separator = ' ';
    className = 'clue-row';
  } else { // a column clue
    puzzle = Array.from(Array(10), (_, row) => props.puzzle[toIndex(row, props.index)]);
    guesses = Array.from(Array(10), (_, row) => props.guesses[toIndex(row, props.index)]);
    separator = <br />;
    className = 'clue-col';
  }
  // Build the clue string by scanning the row or column and identifying runs
  // of coins. For each run, push the count of coins to `count`. Also, if the
  // run is part of an unbroken string of guesses from either edge, push true
  // to `known`, else push false.
  let count = [];
  let known = [];
  let col0 = 0;
  let t = puzzle[0];
  for (let col = 1; col <= 10; col++) {
    if (col === 10 || puzzle[col] !== t) {
      if (t) {
        count.push(col - col0);
        known.push(guesses.slice(0, col).every(p => p) ||
                   guesses.slice(col0, 10).every(p => p));
      }
      t = !t;
      col0 = col;
    }
  }
  // Check if every coin in the row or column has been guessed.
  let all = true;
  for (let col = 0; col < 10; col++) {
    if (puzzle[col] && !guesses[col]) {
      all = false;
    }
  }
  // Build an array of clues as <span> elements, colored based on `all` and
  // `known`.
  let text = [];
  let sep = null;
  for (let n = 0; n < count.length; n++) {
    if (all) {
      text.push(<span className="clue-done">{sep}{count[n]}</span>);
    } else if (known[n]) {
      text.push(<span className="clue-known">{sep}{count[n]}</span>);
    } else {
      text.push(<span className="clue-new">{sep}{count[n]}</span>);
    }
    sep = separator;
  }
  return (<td className={className}>{text}</td>);
}

function Square(props) {
  // Each square is a button, containing the appropriate SVG image if a guess
  // has been made for it.
  let body;
  if (props.guess === 'o') {
    if (props.coin) {
      body = (
        <svg width="34" height="34">
          <g>
            <circle className="coin" cx="17" cy="17" r="12" />
          </g>
        </svg>
      );
    } else {
      body = (
        <svg width="34" height="34">
          <g>
            <circle className="space" cx="17" cy="17" r="8" />
          </g>
        </svg>
      );
    }
  } else if (props.guess === 'x') {
    if (props.coin) {
      body = (
        <svg width="34" height="34">
          <g>
            <circle className="coin" cx="17" cy="17" r="12" />
            <path className="mistake" d="m 13 13 l 8 8" />
            <path className="mistake" d="m 13 21 l 8 -8" />
          </g>
        </svg>
      );
    } else {
      body = (
        <svg width="34" height="34">
          <g>
            <circle className="space" cx="17" cy="17" r="8" />
            <path className="mistake" d="m 13 13 l 8 8" />
            <path className="mistake" d="m 13 21 l 8 -8" />
          </g>
        </svg>
      );
    }
  } else {
    body = null;
  }
  return (
    <td className="square">
      <button
        className="square-button"
        onClick={props.onClick}
        onContextMenu={props.onClick}
      >
        {body}
      </button>
    </td>
  );
}

function Puzzle(props) {
  // Build the puzzle <table> as an array of <tr> rows.
  // -- first, the column clues
  let rows = [(
    <tr key={0}>
      <td></td>
      { Array.from(Array(10), (_, col) => (
          <Clue
            key={'cc' + col}
            orientation='column'
            index={col}
            puzzle={props.puzzle}
            guesses={props.guesses}
          />
        ))
      }
    </tr>
  )];
  // -- next, for each row: the row clue and 10 squares
  for (let row = 0; row < 10; row++) {
    rows.push(
      <tr key={row + 1}>
        <Clue
          key={'cr' + row}
          orientation='row'
          index={row}
          puzzle={props.puzzle}
          guesses={props.guesses}
        />
        { Array.from(Array(10), (_, col) => (
            <Square
              key={row + ',' + col}
              coin={props.puzzle[toIndex(row, col)]}
              guess={props.guesses[toIndex(row, col)]}
              onClick={(event) => props.onSquareClick(event, row, col)}
            />
          ))
        }
      </tr>
    );
  }
  // -- wrap it in the table
  return (
    <table className="puzzle">
      <tbody>
        {rows}
      </tbody>
    </table>
  );
}

function Score(props) {
  return (
    <span>Mistakes: {props.mistakes}</span>
  );
}

function Undo(props) {
  return (
    <button className="button" onClick={props.onClick}>Undo</button>
  );
}

function NewGame(props) {
  return (
    <button className="button" onClick={props.onClick}>New Game</button>
  );
}

function AutoFill(props) {
  return (
    <label>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange} />
      Auto-fill spaces
    </label>
  );
}

/* ---------- Main Component ---------- */

class Game extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      autoFill: false,
    }
    Object.assign(this.state, newPuzzle(this.state.autoFill));
  }

  componentDidMount() {
    // Hide the 'Loading...' text and display the app.
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'inherit';
  }

  onSquareClick = (event, row, col) => {
    console.log('Square!', event.type, row, col);
    //console.log(event.nativeEvent.which); // 1, 2 or 3 for left, middle, right click
    //console.log(event.type); // 'click' for left or middle, 'contextmenu' for right click
    let index = toIndex(row, col);
    if (!this.state.guesses[index]) {
      let guesses = this.state.guesses.slice();
      let mistakes = this.state.mistakes;
      let thisMoveUndo = [index];
      if (event.type === 'click') {
        // left click: user guessed square is occupied
        if (this.state.puzzle[index]) {
          guesses[index] = 'o'; // guess okay
          if (this.state.autoFill) {
            // checkForFill modifies `guesses` and `thisMoveUndo`
            checkForFill(this.state.puzzle, guesses, thisMoveUndo, row, col);
          }
        } else {
          guesses[index] = 'x'; // mistake
          mistakes++;
        }
      } else {
        // contextmenu: user guessed square is empty
        event.preventDefault();
        if (!this.state.puzzle[index]) {
          guesses[index] = 'o';
        } else {
          guesses[index] = 'x';
          mistakes++;
          if (this.state.autoFill) {
            // checkForFill modifies `guesses` and `thisMoveUndo`
            checkForFill(this.state.puzzle, guesses, thisMoveUndo, row, col);
          }
        }
      }
      let undo = this.state.undo.slice();
      undo.push(thisMoveUndo);
      this.setState({ mistakes, guesses, undo });
    }
  }

  onUndoClick = () => {
    console.log('Undo!');
    if (this.state.undo.length > 0) {
      // Remove the array of changes from the last move from the undo stack, and
      // set each square in it to be un-guessed.
      let mistakes = this.state.mistakes;
      let guesses = this.state.guesses.slice();
      let undo = this.state.undo.slice();
      let thisMoveUndo = undo.pop();
      for (let index of thisMoveUndo) {
        if (guesses[index] === 'x') {
          mistakes--;
        }
        guesses[index] = false;
      }
      this.setState({ mistakes, guesses, undo });
    }
  }

  onNewGameClick = () => {
    console.log('New Game!');
    this.setState(newPuzzle(this.state.autoFill));
  }

  onAutoFillChange = () => {
    console.log('Auto-fill Change!');
    this.setState({ autoFill: !this.state.autoFill });
  }

  render() {
    return (
      <div className="row">
        <div className="puzzle-border">
          <Puzzle
            puzzle={this.state.puzzle}
            guesses={this.state.guesses}
            onSquareClick={this.onSquareClick}
          />
          <div className="button_row">
            <div className="col">
              <Score mistakes={this.state.mistakes} />
            </div>
            <div className="col">
              <Undo onClick={this.onUndoClick} />
            </div>
            <div className="col">
              <NewGame onClick={this.onNewGameClick} />
            </div>
            <div className="col">
              <AutoFill checked={this.state.autoFill} onChange={this.onAutoFillChange} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

/* ---------- Game Logic ---------- */

function toIndex(row, col) {
  return row * 10 + col;
}

function newPuzzle(autoFill) {
  let mistakes = 0;
  let puzzle = Array.from(Array(100), () => Math.random(1.0) < 0.5);
  let guesses = Array(100).fill(false);
  let undo = [];
  if (autoFill) {
    for (let i = 0; i < 10; i++) {
      checkForFill(puzzle, guesses, undo, i, i);
    }
  }
  return { mistakes, puzzle, guesses, undo };
};

function checkForFill(puzzle, guesses, undo, row, col) {
  // For the given row and column, check if all occupied squares have been
  // guessed. If so, auto-fill any spaces in them with correct guesses.
  // * This modifies `guesses` and `undo`. *
  let all = true;
  for (let r = 0; r < 10; r++) {
    let index = toIndex(r, col);
    if (puzzle[index] && !guesses[index]) {
      all = false;
      break;
    }
  }
  if (all) {
    for (let r = 0; r < 10; r++) {
      let index = toIndex(r, col);
      if (!puzzle[index] && !guesses[index]) {
        guesses[index] = 'o';
        undo.push(index);
      }
    }
  }
  all = true;
  for (let c = 0; c < 10; c++) {
    let index = toIndex(row, c);
    if (puzzle[index] && !guesses[index]) {
      all = false;
      break;
    }
  }
  if (all) {
    for (let c = 0; c < 10; c++) {
      let index = toIndex(row, c);
      if (!puzzle[index] && !guesses[index]) {
        guesses[index] = 'o';
        undo.push(index);
      }
    }
  }
}
