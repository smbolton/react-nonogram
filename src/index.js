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
  return (<td>S{props.row},{props.col}</td>);
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
        { Array.from(Array(10), (_, col) => (<Square key={row + ',' + col} col={col} row={row} />)) }
      </tr>
    );
  }
  return (
    <div className="row">
      <table>
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
      mistakes: 0,
    }
  }

  onNewGameClick = () => {
    console.log('New Game!');
  }

  onAutoFillChange = () => {
    console.log('Auto-fill Change!');
    this.setState({ autoFill: !this.state.autoFill });
  }

  render() {
    return (
      <div>
        <div className="row">
          <Puzzle />
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
