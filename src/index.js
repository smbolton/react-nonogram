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
// |   Score     NewGame     AutoFill  |
// +-----------------------------------+

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Clue(props) {
  return (<td>C{props.index}</td>);
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
      { Array.from(Array(10), (_, col) => (<Clue key={'cc' + col} index={col} />)) }
    </tr>
  )];
  for (let row = 0; row < 10; row++) {
    rows.push(
      <tr key={row + 1}>
        <Clue key={'cr' + row} index={row} />
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
    Object.assign(this.state, newPuzzle());
  }

  onSquareClick = (event, row, col) => {
    console.log('Square!', event.type, row, col);
    //console.log(event.nativeEvent.which); // 1, 2 or 3 for left, middle, right click
    //console.log(event.type); // 'click' for left or middle, 'contextmenu' for right click
    let index = toIndex(row, col);
    if (!this.state.guesses[index]) {
      let guesses = this.state.guesses.slice();
      let mistakes = this.state.mistakes;
      if (event.type === 'click') {
        if (this.state.puzzle[index]) {
          guesses[index] = 'o'; // guess okay
          if (this.state.autoFill) {
            checkForFill(this.state.puzzle, guesses, row, col);
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
            checkForFill(this.state.puzzle, guesses, row, col);
          }
        }
      }
      this.setState({ mistakes, guesses });
    }
  }

  onNewGameClick = () => {
    console.log('New Game!');
    this.setState(newPuzzle());
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

function newPuzzle() {
  let mistakes = 0;
  let puzzle = Array.from(Array(100), () => Math.random(1.0) < 0.5);
  let guesses = Array(100).fill(false);
  return { mistakes, puzzle, guesses };
};

function checkForFill(puzzle, guesses, row, col) {
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
      if (!puzzle[index]) {
        guesses[index] = guesses[index] || 'o';
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
      if (!puzzle[index]) {
        guesses[index] = guesses[index] || 'o';
      }
    }
  }
}
