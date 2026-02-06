import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Cell = "X" | "O" | null;

type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TgWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  initDataUnsafe?: {
    user?: TgUser;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: TgWebApp;
    };
  }
}

const LINES: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calcWinner(board: Cell[]): "X" | "O" | null {
  for (const [a, b, c] of LINES) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  return null;
}

export default function App() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  const winner = useMemo(() => calcWinner(board), [board]);
  const isDraw = useMemo(() => !winner && board.every(Boolean), [winner, board]);

  const tg = useMemo(() => window.Telegram?.WebApp, []);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const playerName = useMemo(() => {
    const u = tg?.initDataUnsafe?.user;
    if (!u) return null;
    return u.username ? `@${u.username}` : [u.first_name, u.last_name].filter(Boolean).join(" ");
  }, [tg]);

  function play(i: number) {
    if (board[i] || winner) return;

    setBoard((prev) => {
      const next = prev.slice();
      next[i] = turn;
      return next;
    });

    setTurn((t) => (t === "X" ? "O" : "X"));
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
  }

  function sendResultToBot() {
    if (!tg) return;

    const payload = {
      type: "xo_result",
      winner: winner ?? (isDraw ? "draw" : null),
      board,
      finishedAt: new Date().toISOString(),
    };

    tg.sendData(JSON.stringify(payload));
    tg.close();
  }

  return (
    <div className="wrap">
      <h1>XO (Telegram Web App)</h1>

      <div className="theme-toggle">
        <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>

      {playerName && <div className="user">User: <b>{playerName}</b></div>}

      <div className={`status ${winner ? "status--winner" : ""}`}>
        {winner && <b>G‘olib: {winner}</b>}
        {!winner && !isDraw && (
          <span>
            Navbat: <b>{turn}</b>
          </span>
        )}
        {isDraw && <b>Durrang</b>}
      </div>

      <div className="grid">
        {board.map((v, i) => (
          <button
            key={i}
            className="cell"
            onClick={() => play(i)}
            aria-label={`cell-${i}`}
          >
            {v ?? ""}
          </button>
        ))}
      </div>

      <div className="actions">
        <button onClick={reset}>Qayta boshlash</button>
        <button disabled={!winner && !isDraw} onClick={sendResultToBot}>
          Natijani botga yuborish
        </button>
      </div>
    </div>
  );
}
