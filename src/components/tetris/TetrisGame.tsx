"use client"

import styles from "@/styles/tetris.module.css"
import { useEffect, useState } from "react"

/**
 * Self-contained Tetris implementation.
 *
 * No external game-engine / npm dependency, no audio of any kind (no
 * <audio>, no Web Audio API) - purely visual + keyboard driven, matching the
 * product owner's constraint.
 *
 * The game state machine below is written as a set of pure functions
 * (GameState -> GameState). Every mutation goes through `setGame(prev => fn(prev))`,
 * so there is no risk of stale-closure bugs in the gravity interval or the
 * keydown handler - both always operate on the freshest state.
 */

const COLS = 10
const ROWS = 20

type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
type Board = CellValue[][]
type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L"

interface ActivePiece {
  type: PieceType
  rotation: number // 0-3
  row: number // top-left of the 4x4 bounding box; can be negative while spawning
  col: number
}

interface GameState {
  board: Board
  piece: ActivePiece | null
  nextType: PieceType
  bag: PieceType[]
  score: number
  lines: number
  level: number
  gameOver: boolean
  flashSeed: number
}

const PIECE_ORDER: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"]

const PIECE_ID: Record<PieceType, CellValue> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
}

const CELL_COLORS: Record<CellValue, string> = {
  0: "bg-gray-950",
  1: "bg-cyan-400",
  2: "bg-yellow-400",
  3: "bg-purple-500",
  4: "bg-green-500",
  5: "bg-red-500",
  6: "bg-blue-500",
  7: "bg-orange-500",
}

const LINE_SCORES = [0, 100, 300, 500, 800]

// SHAPES[type][rotation] = 4x4 grid, 1 = filled cell.
// Hardcoded rotation states (rather than a rotation matrix) so a rotation
// can never "corrupt" a piece - every state below has exactly 4 filled cells.
const SHAPES: Record<PieceType, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  T: [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
}

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as CellValue[])
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Pure "7-bag" randomizer: pulls one piece from the bag, refilling with a fresh shuffle when empty. */
function drawFromBag(bag: PieceType[]): { type: PieceType; bag: PieceType[] } {
  const source = bag.length > 0 ? bag : shuffle(PIECE_ORDER)
  const type = source[source.length - 1]
  return { type, bag: source.slice(0, -1) }
}

function checkCollision(
  board: Board,
  type: PieceType,
  rotation: number,
  row: number,
  col: number,
): boolean {
  const shape = SHAPES[type][rotation]
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue
      const boardRow = row + r
      const boardCol = col + c
      // Out of the left/right/bottom walls -> collision.
      if (boardCol < 0 || boardCol >= COLS || boardRow >= ROWS) return true
      // Above the visible board is allowed (piece is still spawning in).
      if (boardRow >= 0 && board[boardRow][boardCol] !== 0) return true
    }
  }
  return false
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === 0))
  const cleared = ROWS - remaining.length
  const emptyRows: Board = Array.from({ length: cleared }, () => Array(COLS).fill(0) as CellValue[])
  return { board: [...emptyRows, ...remaining], cleared }
}

function spawnPiece(type: PieceType): ActivePiece {
  // Column 3 centers the 4-wide bounding box on a 10-wide board.
  return { type, rotation: 0, row: -1, col: 3 }
}

function createInitialState(): GameState {
  const { type: first, bag: bagAfterFirst } = drawFromBag([])
  const { type: next, bag } = drawFromBag(bagAfterFirst)
  return {
    board: createEmptyBoard(),
    piece: spawnPiece(first),
    nextType: next,
    bag,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    flashSeed: 0,
  }
}

function tryMove(prev: GameState, dRow: number, dCol: number): GameState {
  if (prev.gameOver || !prev.piece) return prev
  const { piece } = prev
  if (checkCollision(prev.board, piece.type, piece.rotation, piece.row + dRow, piece.col + dCol)) {
    return prev
  }
  return { ...prev, piece: { ...piece, row: piece.row + dRow, col: piece.col + dCol } }
}

function tryRotate(prev: GameState): GameState {
  if (prev.gameOver || !prev.piece) return prev
  const { piece } = prev
  const rotation = (piece.rotation + 1) % 4
  // Simple wall-kick attempts (not full SRS): try in place, then nudge left/right.
  const kicks = [0, -1, 1, -2, 2]
  for (const dx of kicks) {
    if (!checkCollision(prev.board, piece.type, rotation, piece.row, piece.col + dx)) {
      return { ...prev, piece: { ...piece, rotation, col: piece.col + dx } }
    }
  }
  return prev
}

function lockPiece(prev: GameState): GameState {
  if (!prev.piece) return prev
  const board = prev.board.map((row) => [...row]) as Board
  const shape = SHAPES[prev.piece.type][prev.piece.rotation]
  let toppedOut = false

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue
      const boardRow = prev.piece.row + r
      const boardCol = prev.piece.col + c
      if (boardRow < 0) {
        // Locked while still above the visible board -> the stack topped out.
        toppedOut = true
        continue
      }
      if (boardRow >= ROWS || boardCol < 0 || boardCol >= COLS) continue
      board[boardRow][boardCol] = PIECE_ID[prev.piece.type]
    }
  }

  const { board: clearedBoard, cleared } = clearLines(board)
  const lines = prev.lines + cleared
  const level = Math.floor(lines / 10) + 1
  const score = prev.score + LINE_SCORES[cleared] * level
  const flashSeed = cleared > 0 ? prev.flashSeed + 1 : prev.flashSeed

  if (toppedOut) {
    return { ...prev, board: clearedBoard, score, lines, level, piece: null, gameOver: true, flashSeed }
  }

  const spawned = spawnPiece(prev.nextType)
  const { type: upcoming, bag } = drawFromBag(prev.bag)

  if (checkCollision(clearedBoard, spawned.type, spawned.rotation, spawned.row, spawned.col)) {
    return {
      ...prev,
      board: clearedBoard,
      score,
      lines,
      level,
      piece: null,
      gameOver: true,
      flashSeed,
      nextType: upcoming,
      bag,
    }
  }

  return {
    ...prev,
    board: clearedBoard,
    score,
    lines,
    level,
    piece: spawned,
    nextType: upcoming,
    bag,
    gameOver: false,
    flashSeed,
  }
}

function tick(prev: GameState): GameState {
  if (prev.gameOver || !prev.piece) return prev
  if (!checkCollision(prev.board, prev.piece.type, prev.piece.rotation, prev.piece.row + 1, prev.piece.col)) {
    return { ...prev, piece: { ...prev.piece, row: prev.piece.row + 1 } }
  }
  return lockPiece(prev)
}

function hardDrop(prev: GameState): GameState {
  if (prev.gameOver || !prev.piece) return prev
  let row = prev.piece.row
  while (!checkCollision(prev.board, prev.piece.type, prev.piece.rotation, row + 1, prev.piece.col)) {
    row++
  }
  const distance = row - prev.piece.row
  const dropped: GameState = {
    ...prev,
    piece: { ...prev.piece, row },
    score: prev.score + distance * 2,
  }
  return lockPiece(dropped)
}

function getDisplayBoard(game: GameState): CellValue[][] {
  const display = game.board.map((row) => [...row]) as CellValue[][]
  if (game.piece) {
    const shape = SHAPES[game.piece.type][game.piece.rotation]
    const id = PIECE_ID[game.piece.type]
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue
        const boardRow = game.piece.row + r
        const boardCol = game.piece.col + c
        if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
          display[boardRow][boardCol] = id
        }
      }
    }
  }
  return display
}

const TetrisGame = () => {
  const [game, setGame] = useState<GameState>(() => createInitialState())

  // Gravity: speeds up as the level increases.
  const speed = Math.max(120, 1000 - (game.level - 1) * 80)

  useEffect(() => {
    if (game.gameOver) return
    const id = setInterval(() => {
      setGame((prev) => tick(prev))
    }, speed)
    return () => clearInterval(id)
  }, [speed, game.gameOver])

  // Keyboard controls. Registered once on mount - all updates go through the
  // functional setGame(prev => ...) form, so nothing here ever reads a stale
  // snapshot of the game state.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          setGame((prev) => tryMove(prev, 0, -1))
          break
        case "ArrowRight":
          e.preventDefault()
          setGame((prev) => tryMove(prev, 0, 1))
          break
        case "ArrowDown":
          e.preventDefault()
          setGame((prev) => {
            const moved = tryMove(prev, 1, 0)
            return moved === prev ? prev : { ...moved, score: moved.score + 1 }
          })
          break
        case "ArrowUp":
          e.preventDefault()
          if (!e.repeat) setGame((prev) => tryRotate(prev))
          break
        case " ":
        case "Spacebar":
          e.preventDefault()
          if (!e.repeat) setGame((prev) => hardDrop(prev))
          break
        case "Enter":
          setGame((prev) => (prev.gameOver ? createInitialState() : prev))
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const display = getDisplayBoard(game)

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div
        // Remounting on flashSeed change replays the (non-looping) CSS
        // animation below - purely visual, no timers/state needed for it.
        key={game.flashSeed}
        className={`border-2 border-gray-500 bg-gray-900 p-1 rounded-md ${
          game.flashSeed > 0 ? styles.flash : ""
        }`}
      >
        <div
          className="grid gap-px bg-gray-800"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1.5rem)` }}
        >
          {display.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className={`w-6 h-6 ${CELL_COLORS[cell]}`} />
            )),
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 min-w-[9rem]">
        <div className="bg-gray-900 border border-gray-600 rounded-md p-3">
          <div className="text-sm text-gray-400">Score</div>
          <div className="text-xl font-bold">{game.score}</div>
        </div>
        <div className="bg-gray-900 border border-gray-600 rounded-md p-3">
          <div className="text-sm text-gray-400">Lines</div>
          <div className="text-xl font-bold">{game.lines}</div>
        </div>
        <div className="bg-gray-900 border border-gray-600 rounded-md p-3">
          <div className="text-sm text-gray-400">Level</div>
          <div className="text-xl font-bold">{game.level}</div>
        </div>

        <div className="bg-gray-900 border border-gray-600 rounded-md p-3">
          <div className="text-sm text-gray-400 mb-1">Next</div>
          <div
            className="grid gap-px bg-gray-800 w-fit"
            style={{ gridTemplateColumns: "repeat(4, 1rem)" }}
          >
            {SHAPES[game.nextType][0].map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-4 h-4 ${cell ? CELL_COLORS[PIECE_ID[game.nextType]] : "bg-gray-950"}`}
                />
              )),
            )}
          </div>
        </div>

        <button
          onClick={() => setGame(createInitialState())}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Restart
        </button>

        {game.gameOver && (
          <div className={`bg-red-900/40 border border-red-500 rounded-md p-3 ${styles.gameOverOverlay}`}>
            <div className="text-lg font-bold text-red-300">Game Over</div>
            <div className="text-sm text-gray-300">Press Enter or click Restart to play again.</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TetrisGame
