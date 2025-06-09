import { useState, useEffect } from "react";
import "./App.css";
import GameBoard from "./routes/gameboard";
import { Board, Token } from "../shared/GameModel"

function App() {
  const [count, setCount] = useState(0);
  const board = new Board()

  return (
    <div className="App">
      <GameBoard board={board} />
    </div>
  );
}

export default App;
