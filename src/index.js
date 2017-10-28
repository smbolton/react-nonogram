/* React Nonogram, by Sean Bolton
 *
 * A puzzle game in the vein of Griddlers, Picross, Picma, or Fugazo World Mosaics.
 * See https://en.wikipedia.org/wiki/Nonogram
 *
 * Copyright © 2017 Sean Bolton.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Game--------------------------------+
// |  Puzzle-------+-----------------+ |
// |  |            |     10x Clue    | |
// |  +------------+-----------------+ |
// |  |            |                 | |
// |  |  10x Clue  |  10x10: Square  | |
// |  |            |                 | |
// |  +------------+-----------------+ |
// |                                   |
// |  Score   Undo  NewGame  AutoFill  |
// +-----------------------------------+

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Clue(props) {
  let puzzle, guesses, separator;
  if (props.orientation === 'row') {
    puzzle = Array.from(Array(10), (_, col) => props.puzzle[toIndex(props.index, col)]);
    guesses = Array.from(Array(10), (_, col) => props.guesses[toIndex(props.index, col)]);
    separator = ' ';
  } else { // column
    puzzle = Array.from(Array(10), (_, row) => props.puzzle[toIndex(row, props.index)]);
    guesses = Array.from(Array(10), (_, row) => props.guesses[toIndex(row, props.index)]);
    separator = <br />;
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
  // Build a array of clues as <span> elements, colored based on `all` and `known`.
  let text = [];
  for (let n = 0; n < count.length; n++) {
    if (all) {
      text.push(<span style={{color: '#000'}}>{separator}{count[n]}</span>);
    } else if (known[n]) {
      text.push(<span style={{color: '#00f'}}>{separator}{count[n]}</span>);
    } else {
      text.push(<span style={{color: '#f00'}}>{separator}{count[n]}</span>);
    }
  }
  return (<td>{text}</td>);
}

function Square(props) {
  let body;
  if (props.guess === 'o') {
    if (props.coin) {
      body = (
        <svg width="36" height="36">
          <g>
            <circle className="coin" cx="18" cy="18" r="14" />
          </g>
        </svg>
      );
    } else {
      body = (
        <svg width="40" height="40">
          <g>
            <circle className="space" cx="20" cy="20" r="8" />
          </g>
        </svg>
      );
    }
  } else if (props.guess === 'x') {
    if (props.coin) {
      body = (
        <svg width="40" height="40">
          <g>
            <circle className="coin" cx="20" cy="20" r="17" />
            <path className="mistake" d="m 15 15 l 10 10" />
            <path className="mistake" d="m 15 25 l 10 -10" />
          </g>
        </svg>
      );
    } else {
      body = (
        <svg width="40" height="40">
          <g>
            <circle className="space" cx="20" cy="20" r="8" />
            <path className="mistake" d="m 15 15 l 10 10" />
            <path className="mistake" d="m 15 25 l 10 -10" />
          </g>
        </svg>
      );
    }
  } else {
    body = null; // props.coin ? '*' : '-';
  }
  return (
    <td>
      <button
        className="square"
        onClick={props.onClick}
        onContextMenu={props.onClick}
      >
        {body}
      </button>
    </td>
  );
}

function Puzzle(props) {
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
  return (
    <div className="row">
      <table>
        {/*
        <colgroup>
          <col className="puzzle-clue" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
          <col className="puzzle-col" />
        </colgroup>
        */}
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
}

function Score(props) {
  return (
    <p>Mistakes: {props.mistakes}</p>
  );
}

function Undo(props) {
  return (
    <button onClick={props.onClick}>Undo</button>
  );
}

function NewGame(props) {
  return (
    <button onClick={props.onClick}>New Game</button>
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

class Game extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      autoFill: false,
    }
    Object.assign(this.state, newPuzzle(this.state.autoFill));
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
        if (this.state.puzzle[index]) {
          guesses[index] = 'o'; // guess okay
          if (this.state.autoFill) {
            checkForFill(this.state.puzzle, guesses, thisMoveUndo, row, col);
          }
        } else {
          guesses[index] = 'x'; // mistake
          mistakes++;
        }
      } else { /* contextmenu */
        event.preventDefault();
        if (!this.state.puzzle[index]) {
          guesses[index] = 'o';
        } else {
          guesses[index] = 'x';
          mistakes++;
          if (this.state.autoFill) {
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
      <div>
        <div className="row">
          <Puzzle
            puzzle={this.state.puzzle}
            guesses={this.state.guesses}
            onSquareClick={this.onSquareClick}
          />
        </div>
        <div className="row">
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
    );
  }
}

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

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
