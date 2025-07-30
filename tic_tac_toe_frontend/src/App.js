import React, { useState, useEffect } from "react";
import "./App.css";

/*
  Colors used in this app:
    Primary:   #1976D2 (blue)      -- Used for board, highlight
    Secondary: #388E3C (green)     -- Used for score, accent
    Accent:    #FFC107 (yellow)    -- Used for winning line, accent
*/

function getInitialScore() {
  // Track scores by session storage for persistence per session.
  const store = sessionStorage.getItem("tic-tac-toe-score");
  if (store) return JSON.parse(store);
  return { X: 0, O: 0, ties: 0 };
}
function setSessionScore(score) {
  sessionStorage.setItem("tic-tac-toe-score", JSON.stringify(score));
}

// ---------------------------------
// PUBLIC_INTERFACE
function App() {
  // GAME STATE
  // Modes: "u-vs-u" or "u-vs-c"
  const [mode, setMode] = useState("u-vs-u");
  // "X" always goes first
  const [turn, setTurn] = useState("X");
  const emptyBoard = Array(9).fill("");
  const [board, setBoard] = useState([...emptyBoard]);
  const [winner, setWinner] = useState(null); // values: "X", "O", "tie", null
  const [scores, setScores] = useState(getInitialScore());
  // UI/UX
  const [theme, setTheme] = useState("light");
  const [showStartScreen, setShowStartScreen] = useState(true);

  // Apply theme (light or dark)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Track score in sessionStorage
  useEffect(() => {
    setSessionScore(scores);
  }, [scores]);

  // Computer move effect
  useEffect(() => {
    if (mode === "u-vs-c" && turn === "O" && !winner) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [board, turn, winner, mode]);

  // ---------------------------------
  // PUBLIC_INTERFACE
  // Click handler for each board cell
  function handleCellClick(idx) {
    if (board[idx] || winner) return; // already filled or game over
    let updatedBoard = [...board];
    updatedBoard[idx] = turn;
    const res = checkGameResult(updatedBoard);
    setBoard(updatedBoard);
    if (res) {
      processGameEnd(res);
    } else {
      setTurn((prev) => (prev === "X" ? "O" : "X"));
    }
  }

  // Only simple random AI for user vs. computer ("O" is always computer)
  function makeComputerMove() {
    const moves = getAvailableMoves(board);
    if (moves.length === 0 || winner) return;
    // Try to win if possible, else block, else random
    const move = computeBestMove(board, "O");
    handleCellClick(move);
  }

  // ---------------------------------
  // PUBLIC_INTERFACE
  // Returns: 'X', 'O', 'tie', or null
  function checkGameResult(b) {
    const wins = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let w of wins) {
      const [a, b1, c] = w;
      if (
        b[a] &&
        b[a] === b[b1] &&
        b[b1] === b[c]
      ) {
        return b[a]; // "X" or "O"
      }
    }
    if (b.every((x) => x !== "")) return "tie";
    return null;
  }

  // Called after result known
  function processGameEnd(res) {
    setWinner(res);
    let updatedScores = { ...scores };
    if (res === "X") updatedScores.X += 1;
    else if (res === "O") updatedScores.O += 1;
    else updatedScores.ties += 1;
    setScores(updatedScores);
  }

  function getAvailableMoves(b) {
    return b.map((val, idx) => (val === "" ? idx : null)).filter((v) => v !== null);
  }

  // Computer AI
  function computeBestMove(b, player) {
    // 1. Can win? 2. Can block? 3. Center? 4. Corners? 5. First available.
    // Win
    for (let move of getAvailableMoves(b)) {
      let copy = [...b];
      copy[move] = player;
      if (checkGameResult(copy) === player) return move;
    }
    // Block opponent win
    const opponent = player === "X" ? "O" : "X";
    for (let move of getAvailableMoves(b)) {
      let copy = [...b];
      copy[move] = opponent;
      if (checkGameResult(copy) === opponent) return move;
    }
    // Center
    if (b[4] === "") return 4;
    // Corners
    const corners = [0, 2, 6, 8].filter((i) => b[i] === "");
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    // Any available
    const avail = getAvailableMoves(b);
    return avail[Math.floor(Math.random() * avail.length)];
  }

  // ---------------------------------
  // PUBLIC_INTERFACE
  function handleResetBoard() {
    setBoard([...emptyBoard]);
    setWinner(null);
    setTurn("X");
  }

  // PUBLIC_INTERFACE
  function handleResetScore() {
    setScores({ X: 0, O: 0, ties: 0 });
    handleResetBoard();
  }

  // PUBLIC_INTERFACE
  function handleModeChange(ev) {
    setMode(ev.target.value);
    handleResetScore();
    setShowStartScreen(false);
  }

  function handleBackToMenu() {
    setShowStartScreen(true);
    handleResetScore();
  }
  // ---------------------------------

  // COMPUTE winning line (for highlight)
  const winningLine = getWinningLine(board);

  // --- UI Rendering ---
  return (
    <div className="App app-bg">
      <header className="tictactoe-header">
        <h1
          style={{
            color: "#1976D2",
            marginTop: "20px",
            letterSpacing: "2px",
            fontWeight: 700,
            fontSize: "2.2rem",
          }}
        >
          Tic Tac Toe
        </h1>
        <button
          className="theme-toggle"
          onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      <main>
        {showStartScreen ? (
          <StartScreen mode={mode} onSelect={handleModeChange} />
        ) : (
          <div className="game-main">
            <GameControls
              mode={mode}
              onBack={handleBackToMenu}
              onRestart={handleResetBoard}
              onResetScore={handleResetScore}
            />
            <div className="centered">
              <Board
                board={board}
                onCellClick={handleCellClick}
                disabled={!!winner || (mode === "u-vs-c" && turn === "O")}
                winningLine={winningLine}
              />
              <InfoPanel
                winner={winner}
                turn={turn}
                mode={mode}
              />
              <ScorePanel scores={scores} />
            </div>
          </div>
        )}
      </main>
      <footer className="tictactoe-footer">
        <span style={{ color: "#888", fontSize: "0.90rem" }}>
          &copy; {new Date().getFullYear()} React Tic Tac Toe | KAVIA
        </span>
      </footer>
    </div>
  );
}

// ----- COMPONENTS ------
// PUBLIC_INTERFACE
function StartScreen({ mode, onSelect }) {
  return (
    <div className="start-screen">
      <h2 style={{ marginBottom: 20 }}>Choose Game Mode</h2>
      <div className="mode-buttons">
        <button
          className={`btn mode-btn${mode === "u-vs-u" ? " selected" : ""}`}
          value="u-vs-u"
          onClick={onSelect}
        >
          User vs. User
        </button>
        <button
          className={`btn mode-btn${mode === "u-vs-c" ? " selected" : ""}`}
          value="u-vs-c"
          onClick={onSelect}
        >
          User vs. Computer
        </button>
      </div>
      <p style={{ marginTop: 26, color: "#555" }}>
        <span>
          Use the buttons above to select how you want to play.<br />
          X always goes first.
        </span>
      </p>
    </div>
  );
}

// PUBLIC_INTERFACE
function GameControls({ mode, onBack, onRestart, onResetScore }) {
  return (
    <div className="game-controls">
      <button className="btn back-btn" onClick={onBack}>
        ← Menu
      </button>
      <span className="game-mode-label">
        Mode: <b>{mode === "u-vs-u" ? "User vs User" : "User vs Computer"}</b>
      </span>
      <button className="btn restart-btn" onClick={onRestart}>
        ↻ Restart
      </button>
      <button className="btn reset-score-btn" onClick={onResetScore}>
        ⬇ Reset Score
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function Board({ board, onCellClick, disabled, winningLine }) {
  // 3x3 grid
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
      {board.map((val, idx) => {
        let cellClass = "ttt-cell";
        if (winningLine && winningLine.includes(idx)) {
          cellClass += " win-cell";
        }
        return (
          <button
            type="button"
            tabIndex={0}
            aria-label={`Cell ${idx + 1}, ${val || "empty"}`}
            className={cellClass}
            key={idx}
            onClick={() => onCellClick(idx)}
            disabled={disabled || !!val}
            style={{ transitionDelay: winningLine ? `${winningLine.indexOf(idx) * 60}ms` : "0ms" }}
          >
            <span className="piece">{val}</span>
          </button>
        );
      })}
    </div>
  );
}

// PUBLIC_INTERFACE
function InfoPanel({ winner, turn, mode }) {
  return (
    <div className="info-panel">
      {!winner ? (
        <span>
          Turn:&nbsp;
          <span className={turn === "X" ? "turn-x" : "turn-o"}>
            {turn === "X" ? "X" : mode === "u-vs-c" ? (turn === "O" ? "Computer (O)" : "You (X)") : turn}
          </span>
        </span>
      ) : winner === "tie" ? (
        <span style={{ color: "#FFC107" }}>It's a tie!</span>
      ) : (
        <span style={{ color: winner === "X" ? "#1976D2" : "#388E3C", fontWeight: "bold" }}>
          {mode === "u-vs-c" && winner === "O" ? "Computer" : winner} wins!
        </span>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function ScorePanel({ scores }) {
  // Session-local scores
  return (
    <div className="score-panel">
      <span className="score-x">
        X: <b>{scores.X}</b>
      </span>
      <span className="score-tie">
        Ties: <b>{scores.ties}</b>
      </span>
      <span className="score-o">
        O: <b>{scores.O}</b>
      </span>
    </div>
  );
}

// Helper: get winning line if one exists, for highlight
function getWinningLine(b) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b1, c] = line;
    if (b[a] && b[a] === b[b1] && b[b1] === b[c]) return line;
  }
  return null;
}

export default App;
