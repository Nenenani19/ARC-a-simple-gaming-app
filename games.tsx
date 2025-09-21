import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSound } from './useSound';
import { Match, User } from './types';

type GameProps = {
  updateScore: (gameId: string, score: number) => void;
};

type MultiplayerGameProps = {
    user: User;
    match: Match;
    onUpdateMatch: (match: Match) => void;
};

// --- Helper: Tic Tac Toe Winner Calculation ---
function calculateWinner(squares: (string | null)[]) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every(Boolean)) return 'Draw';
    return null;
}

// --- 1. Tic Tac Toe (vs. Bot) ---
export const TicTacToe: React.FC<GameProps> = ({ updateScore }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is 'X'
  const { playClick, playWin, playLose } = useSound();
  const winner = calculateWinner(board);

  const handleClick = (i: number) => {
    if (winner || board[i] || !isPlayerTurn) return;
    playClick();
    const newBoard = board.slice();
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  useEffect(() => {
    if (winner) {
        if (winner === 'X') {
            playWin();
            updateScore('tic-tac-toe', 10);
        } else if (winner === 'O') {
            playLose();
        }
    } else if (!isPlayerTurn) {
      // Bot's turn
      const timer = setTimeout(() => {
        const findBestMove = (currentBoard: (string|null)[]) => {
            // 1. Bot checks if it can win
            for (let i = 0; i < 9; i++) {
                if (!currentBoard[i]) {
                    const tempBoard = currentBoard.slice();
                    tempBoard[i] = 'O';
                    if (calculateWinner(tempBoard) === 'O') return i;
                }
            }
            // 2. Bot checks if it needs to block the player
            for (let i = 0; i < 9; i++) {
                if (!currentBoard[i]) {
                    const tempBoard = currentBoard.slice();
                    tempBoard[i] = 'X';
                    if (calculateWinner(tempBoard) === 'X') return i;
                }
            }
            // 3. Take center
            if (!currentBoard[4]) return 4;
            // 4. Take random corner
            const corners = [0, 2, 6, 8].filter(i => !currentBoard[i]);
            if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
            // 5. Take random side
            const sides = [1, 3, 5, 7].filter(i => !currentBoard[i]);
            if (sides.length > 0) return sides[Math.floor(Math.random() * sides.length)];
            return null;
        };
        
        const bestMove = findBestMove(board);
        if (bestMove !== null) {
            playClick();
            const newBoard = board.slice();
            newBoard[bestMove] = 'O';
            setBoard(newBoard);
            setIsPlayerTurn(true);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [board, isPlayerTurn, winner, updateScore, playWin, playLose, playClick]);

  const resetGame = () => {
    playClick();
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
  };

  const getStatus = () => {
      if (winner) {
          if (winner === 'Draw') return 'It\'s a Draw!';
          return winner === 'X' ? 'You Win!' : 'Bot Wins!';
      }
      return isPlayerTurn ? 'Your Turn (X)' : 'Bot is thinking...';
  };

  return (
    <div className="flex flex-col items-center p-4 font-roboto-mono">
      <h3 className="text-2xl font-orbitron mb-4 h-8">{getStatus()}</h3>
      <div className="grid grid-cols-3 gap-2">
        {board.map((value, i) => (
          <button 
            key={i} 
            onClick={() => handleClick(i)} 
            className={`w-24 h-24 bg-brand-surface border-2 border-brand-border text-4xl font-bold flex items-center justify-center text-brand-primary transition-colors ${!value && isPlayerTurn && !winner ? 'cursor-pointer hover:bg-brand-border' : 'cursor-not-allowed'}`}
            disabled={!isPlayerTurn || !!value || !!winner}
          >
            {value}
          </button>
        ))}
      </div>
      {winner && <button onClick={resetGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded hover:bg-opacity-80 transition">Play Again</button>}
    </div>
  );
};


// --- 2. Memory Match ---
export const MemoryMatch: React.FC<GameProps> = ({ updateScore }) => {
    const EMOJIS = ['🚀', '🔥', '🎉', '🌟', '💻', '💡', '🤖', '🧠'];
    const generateCards = () => [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, isFlipped: false, isMatched: false }));

    const [cards, setCards] = useState(generateCards());
    const [flipped, setFlipped] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const { playClick, playScore, playWin, playLose } = useSound();

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || cards[index].isFlipped) return;
        playClick();

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        setFlipped([...flipped, index]);
    };

    useEffect(() => {
        if (flipped.length === 2) {
            setMoves(m => m + 1);
            const [first, second] = flipped;
            if (cards[first].emoji === cards[second].emoji) {
                playScore();
                const newCards = cards.map(card => 
                    card.emoji === cards[first].emoji ? { ...card, isMatched: true } : card
                );
                setCards(newCards);
                setFlipped([]);
            } else {
                playLose();
                setTimeout(() => {
                    const newCards = [...cards];
                    newCards[first].isFlipped = false;
                    newCards[second].isFlipped = false;
                    setCards(newCards);
                    setFlipped([]);
                }, 1000);
            }
        }
    }, [flipped, cards, playScore, playLose]);

    const isGameWon = cards.every(c => c.isMatched);

    useEffect(() => {
        if(isGameWon && moves > 0){
            playWin();
            updateScore('memory-match', Math.max(0, 100 - (moves - EMOJIS.length) * 5));
        }
    }, [isGameWon, moves, updateScore, playWin]);

    const resetGame = () => {
        playClick();
        setCards(generateCards());
        setFlipped([]);
        setMoves(0);
    };

    return (
        <div className="flex flex-col items-center p-4">
            <h3 className="text-xl font-orbitron mb-2">Moves: {moves}</h3>
            {isGameWon ? (
                <div className="text-center">
                    <p className="text-2xl text-brand-success font-bold mb-4">You Won!</p>
                    <button onClick={resetGame} className="px-4 py-2 bg-brand-primary text-black rounded hover:bg-opacity-80 transition">Play Again</button>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                        <div key={card.id} onClick={() => handleCardClick(i)} className={`w-20 h-28 rounded-lg cursor-pointer transition-transform duration-500 preserve-3d ${card.isFlipped ? 'rotate-y-180' : ''}`}>
                            <div className="absolute w-full h-full backface-hidden bg-brand-primary flex items-center justify-center rounded-lg"></div>
                            <div className="absolute w-full h-full backface-hidden bg-brand-surface rotate-y-180 flex items-center justify-center text-4xl rounded-lg">{card.isFlipped ? card.emoji : ''}</div>
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                .preserve-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
            `}</style>
        </div>
    );
};

// --- 3. Rock Paper Scissors ---
export const RockPaperScissors: React.FC<GameProps> = ({ updateScore }) => {
    const choices = ['rock', 'paper', 'scissors'];
    const [playerChoice, setPlayerChoice] = useState<string | null>(null);
    const [computerChoice, setComputerChoice] = useState<string | null>(null);
    const [result, setResult] = useState('');
    const [score, setScore] = useState(0);
    const { playClick, playWin, playLose } = useSound();

    const handlePlay = (choice: string) => {
        playClick();
        const computerChoice = choices[Math.floor(Math.random() * choices.length)];
        setPlayerChoice(choice);
        setComputerChoice(computerChoice);

        if (choice === computerChoice) {
            setResult('Draw!');
        } else if (
            (choice === 'rock' && computerChoice === 'scissors') ||
            (choice === 'paper' && computerChoice === 'rock') ||
            (choice === 'scissors' && computerChoice === 'paper')
        ) {
            playWin();
            setResult('You Win!');
            const newScore = score + 1;
            setScore(newScore);
            updateScore('rock-paper-scissors', newScore * 10);
        } else {
            playLose();
            setResult('You Lose!');
        }
    };

    return (
        <div className="text-center font-roboto-mono">
            <h3 className="text-2xl font-orbitron mb-4">Choose your weapon!</h3>
            <div className="flex justify-center gap-4 mb-6">
                {choices.map(choice => (
                    <button key={choice} onClick={() => handlePlay(choice)} className="px-6 py-3 bg-brand-surface border border-brand-border rounded-lg text-lg capitalize hover:bg-brand-primary hover:text-black transition-all">
                        {choice}
                    </button>
                ))}
            </div>
            {playerChoice && (
                <div className="animate-fadeIn">
                    <p>You chose: <span className="font-bold text-brand-primary">{playerChoice}</span></p>
                    <p>Computer chose: <span className="font-bold text-brand-accent">{computerChoice}</span></p>
                    <p className="text-3xl font-orbitron mt-4">{result}</p>
                    <p className="mt-2">Your Score: {score}</p>
                </div>
            )}
        </div>
    );
};


// --- 4. Snake ---
export const Snake: React.FC<GameProps> = ({ updateScore }) => {
    const GRID_SIZE = 20;
    const initialSnake = [{ x: 10, y: 10 }];
    const initialFood = { x: 15, y: 15 };
    const { playScore, playLose, playStart } = useSound();

    const [snake, setSnake] = useState(initialSnake);
    const [food, setFood] = useState(initialFood);
    const [direction, setDirection] = useState({ x: 0, y: -1 }); // 'UP'
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);

    const generateFood = (currentSnake: {x:number, y:number}[]) => {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
        } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    };

    const resetGame = useCallback(() => {
        playStart();
        setSnake(initialSnake);
        setFood(initialFood);
        setDirection({ x: 0, y: -1 });
        setGameOver(false);
        setScore(0);
    }, [playStart]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction]);

    useEffect(() => {
        if (gameOver) {
            updateScore('snake', score);
            playLose();
            return;
        }

        const gameLoop = setInterval(() => {
            const newSnake = [...snake];
            const head = { ...newSnake[0] };
            head.x += direction.x;
            head.y += direction.y;

            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                setGameOver(true);
                return;
            }
            for (let i = 1; i < newSnake.length; i++) {
                if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
                    setGameOver(true);
                    return;
                }
            }

            newSnake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                playScore();
                setScore(s => s + 10);
                setFood(generateFood(newSnake));
            } else {
                newSnake.pop();
            }

            setSnake(newSnake);
        }, 150);

        return () => clearInterval(gameLoop);
    }, [snake, direction, food, gameOver, score, updateScore, playLose, playScore]);

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-xl font-orbitron mb-2">Score: {score}</h3>
            {gameOver ? (
                <div className="text-center">
                    <p className="text-2xl text-brand-danger font-bold">Game Over</p>
                    <button onClick={resetGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded hover:bg-opacity-80 transition">Play Again</button>
                </div>
            ) : (
                <div className="grid border-2 border-brand-border" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`}}>
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const isSnake = snake.some(seg => seg.x === x && seg.y === y);
                        const isFood = food.x === x && food.y === y;
                        return <div key={i} className={`w-4 h-4 ${isSnake ? 'bg-brand-success' : isFood ? 'bg-brand-danger' : 'bg-brand-surface'}`}></div>;
                    })}
                </div>
            )}
        </div>
    );
};

// --- 5. Typing Speed Test ---
export const TypingSpeed: React.FC<GameProps> = ({ updateScore }) => {
    const TEXT = "The quick brown fox jumps over the lazy dog. This is a test of your typing speed and accuracy. Do your best!";
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [wpm, setWpm] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const { playStart, playWin, playClick } = useSound();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isFinished) return;
        if (!startTime) {
            playStart();
            setStartTime(Date.now());
        }
        playClick();
        const typedValue = e.target.value;
        setUserInput(typedValue);
        
        if (typedValue === TEXT) {
            playWin();
            const endTime = Date.now();
            if(startTime){
                const duration = (endTime - startTime) / 1000 / 60;
                const words = TEXT.split(' ').length;
                const calculatedWpm = Math.round(words / duration);
                setWpm(calculatedWpm);
                updateScore('typing-speed', calculatedWpm);
            }
            setIsFinished(true);
        }
    };
    
    const resetGame = () => {
        playClick();
        setUserInput('');
        setStartTime(null);
        setWpm(0);
        setIsFinished(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 text-center">
            <h3 className="text-2xl font-orbitron mb-4">Typing Speed Test</h3>
            <p className="bg-brand-surface p-4 rounded-lg mb-4 font-roboto-mono text-left">
                {TEXT.split('').map((char, index) => {
                    let color = 'text-brand-secondary';
                    if (index < userInput.length) {
                        color = char === userInput[index] ? 'text-brand-success' : 'text-brand-danger';
                    }
                    return <span key={index} className={color}>{char}</span>;
                })}
            </p>
            <input 
                type="text" 
                value={userInput} 
                onChange={handleInputChange}
                className="w-full p-2 bg-brand-bg border border-brand-border rounded font-roboto-mono"
                placeholder="Start typing here..."
                disabled={isFinished}
            />
            {isFinished && (
                <div className="mt-4 animate-fadeIn">
                    <p className="text-3xl font-orbitron">Finished!</p>
                    <p className="text-xl">Your WPM: <span className="text-brand-primary">{wpm}</span></p>
                    <button onClick={resetGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded hover:bg-opacity-80 transition">Try Again</button>
                </div>
            )}
        </div>
    );
};

// --- 6. Whack-A-Mole ---
export const WhackAMole: React.FC<GameProps> = ({ updateScore }) => {
    const [moles, setMoles] = useState(Array(9).fill(false));
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isActive, setIsActive] = useState(false);
    const { playScore, playLose, playStart } = useSound();

    useEffect(() => {
        if (!isActive) return;

        const timer = setInterval(() => {
            setTimeLeft(t => t > 0 ? t - 1 : 0);
        }, 1000);
        
        const moleInterval = setInterval(() => {
            const newMoles = Array(9).fill(false);
            const randomIndex = Math.floor(Math.random() * 9);
            newMoles[randomIndex] = true;
            setMoles(newMoles);
        }, 700);

        if (timeLeft === 0) {
            playLose();
            clearInterval(timer);
            clearInterval(moleInterval);
            setIsActive(false);
            setMoles(Array(9).fill(false));
            updateScore('whack-a-mole', score);
        }

        return () => {
            clearInterval(timer);
            clearInterval(moleInterval);
        };
    }, [isActive, timeLeft, score, updateScore, playLose]);

    const handleWhack = (index: number) => {
        if (moles[index]) {
            playScore();
            setScore(s => s + 1);
            setMoles(Array(9).fill(false)); 
        }
    };
    
    const startGame = () => {
        playStart();
        setScore(0);
        setTimeLeft(30);
        setIsActive(true);
    };

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-xl font-orbitron mb-2">Score: {score} | Time: {timeLeft}s</h3>
            {!isActive && timeLeft === 30 ? (
                <button onClick={startGame} className="px-6 py-3 bg-brand-primary text-black rounded-lg text-lg">Start Game</button>
            ) : !isActive && timeLeft === 0 ? (
                 <div className="text-center">
                    <p className="text-2xl text-brand-primary font-bold">Time's Up! Final Score: {score}</p>
                    <button onClick={startGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded hover:bg-opacity-80 transition">Play Again</button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4 p-4 bg-green-900/50 rounded-lg">
                    {moles.map((isUp, i) => (
                        <div key={i} className="w-24 h-24 bg-yellow-900/50 rounded-full flex items-center justify-center cursor-pointer" onClick={() => handleWhack(i)}>
                            {isUp && <div className="w-16 h-16 bg-yellow-600 rounded-full animate-pulse"></div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- 7. Minesweeper ---
export const Minesweeper: React.FC<GameProps> = ({ updateScore }) => {
    const ROWS = 10;
    const COLS = 10;
    const MINES = 15;

    const createEmptyBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
    })));

    const [board, setBoard] = useState(createEmptyBoard());
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const { playClick, playLose, playWin } = useSound();

    const plantMines = (clickedRow: number, clickedCol: number) => {
        let minesPlaced = 0;
        const newBoard = JSON.parse(JSON.stringify(board)); // Deep copy
        
        while (minesPlaced < MINES) {
            const row = Math.floor(Math.random() * ROWS);
            const col = Math.floor(Math.random() * COLS);
            if (!newBoard[row][col].isMine && !(row === clickedRow && col === clickedCol)) {
                newBoard[row][col].isMine = true;
                minesPlaced++;
            }
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (newBoard[r][c].isMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (r + i >= 0 && r + i < ROWS && c + j >= 0 && c + j < COLS && newBoard[r + i][c + j].isMine) {
                            count++;
                        }
                    }
                }
                newBoard[r][c].adjacentMines = count;
            }
        }
        return newBoard;
    };

    const revealCell = (r: number, c: number, currentBoard: typeof board) => {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || currentBoard[r][c].isRevealed || currentBoard[r][c].isFlagged) return;

        currentBoard[r][c].isRevealed = true;

        if (currentBoard[r][c].adjacentMines === 0 && !currentBoard[r][c].isMine) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    revealCell(r + i, c + j, currentBoard);
                }
            }
        }
    };

    const handleCellClick = (r: number, c: number) => {
        if (gameOver || gameWon) return;

        let currentBoard = board;
        // First click logic
        if (!board.some(row => row.some(cell => cell.isRevealed))) {
            currentBoard = plantMines(r, c);
        }

        const newBoard = JSON.parse(JSON.stringify(currentBoard));
        
        if (newBoard[r][c].isMine) {
            playLose();
            setGameOver(true);
            newBoard.forEach((row: any[]) => row.forEach((cell: { isRevealed: boolean; }) => cell.isRevealed = true));
            setBoard(newBoard);
            return;
        }

        playClick();
        revealCell(r, c, newBoard);
        setBoard(newBoard);
    };

    const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameOver || gameWon || board[r][c].isRevealed) return;
        playClick();
        const newBoard = [...board];
        newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
        setBoard(newBoard);
    };
    
    useEffect(() => {
        if (gameOver || gameWon) return;
        const revealedCount = board.flat().filter(cell => cell.isRevealed).length;
        if (revealedCount > 0 && revealedCount === (ROWS * COLS) - MINES) {
            playWin();
            setGameWon(true);
            updateScore('minesweeper', 100);
        }
    }, [board, gameOver, gameWon, playWin, updateScore]);


    const resetGame = () => {
        playClick();
        setBoard(createEmptyBoard());
        setGameOver(false);
        setGameWon(false);
    };

    return (
        <div className="flex flex-col items-center">
            {gameOver && <h3 className="text-2xl font-orbitron mb-2 text-brand-danger">Game Over!</h3>}
            {gameWon && <h3 className="text-2xl font-orbitron mb-2 text-brand-success">You Win!</h3>}
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                {board.map((row, r) => row.map((cell, c) => (
                    <button
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        onContextMenu={(e) => handleRightClick(e, r, c)}
                        className={`w-8 h-8 flex items-center justify-center font-bold border border-brand-border/50
                            ${!cell.isRevealed ? 'bg-brand-surface hover:bg-brand-border' : cell.isMine ? 'bg-brand-danger' : 'bg-brand-bg'}
                        `}
                    >
                        {cell.isRevealed ? (cell.isMine ? '💣' : (cell.adjacentMines > 0 ? cell.adjacentMines : '')) : (cell.isFlagged ? '🚩' : '')}
                    </button>
                )))}
            </div>
            {(gameOver || gameWon) && <button onClick={resetGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded">Play Again</button>}
        </div>
    );
};


// --- 8. Color Guess ---
export const ColorGuess: React.FC<GameProps> = ({ updateScore }) => {
    const generateRandomColor = () => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    };

    const [color, setColor] = useState(generateRandomColor());
    const [options, setOptions] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [score, setScore] = useState(0);
    const { playScore, playLose } = useSound();

    const shuffleArray = (array: string[]) => array.sort(() => Math.random() - 0.5);

    useEffect(() => {
        const correctOption = color;
        const otherOptions = [generateRandomColor(), generateRandomColor()];
        setOptions(shuffleArray([correctOption, ...otherOptions]));
    }, [color]);

    const handleGuess = (guessedColor: string) => {
        if (guessedColor === color) {
            playScore();
            setMessage('Correct!');
            const newScore = score + 10;
            setScore(newScore);
            updateScore('color-guess', newScore);
            setTimeout(() => {
                setColor(generateRandomColor());
                setMessage('');
            }, 1000);
        } else {
            playLose();
            setMessage('Wrong! Game Over.');
        }
    };
    
    if (message.includes('Game Over')) {
        return <div className="text-center">
            <p className="text-xl text-brand-danger mb-4">{message}</p>
            <p className="text-2xl font-orbitron">Final Score: {score}</p>
        </div>
    }

    return (
        <div className="flex flex-col items-center">
            <div className="w-48 h-48 rounded-lg mb-4" style={{ backgroundColor: color }}></div>
            <div className="flex gap-4">
                {options.map(option => (
                    <button key={option} onClick={() => handleGuess(option)} className="px-4 py-2 bg-brand-surface border border-brand-border rounded font-roboto-mono hover:bg-brand-primary hover:text-black">
                        {option}
                    </button>
                ))}
            </div>
            {message && <p className={`mt-4 text-xl ${message === 'Correct!' ? 'text-brand-success' : 'text-brand-danger'}`}>{message}</p>}
             <p className="mt-4 text-xl font-orbitron">Score: {score}</p>
        </div>
    );
};

// --- 9. Hangman ---
export const Hangman: React.FC<GameProps> = ({ updateScore }) => {
    const WORDS = useMemo(() => ["REACT", "JAVASCRIPT", "ARCADE", "FUSION", "DEVELOPER", "COMPONENT"], []);
    const [word, setWord] = useState(WORDS[Math.floor(Math.random() * WORDS.length)]);
    const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
    const { playClick, playWin, playLose } = useSound();
    
    const incorrectGuesses = guessedLetters.filter(letter => !word.includes(letter));
    const isGameOver = incorrectGuesses.length >= 6;
    const isGameWon = word.split('').every(letter => guessedLetters.includes(letter));

    const handleGuess = (letter: string) => {
        playClick();
        if (!guessedLetters.includes(letter)) {
            setGuessedLetters(prev => [...prev, letter]);
        }
    };

    const resetGame = () => {
        playClick();
        setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
        setGuessedLetters([]);
    };
    
    useEffect(() => {
        if(isGameWon) {
            playWin();
            updateScore('hangman', 100 - incorrectGuesses.length * 10);
        }
        if(isGameOver) {
            playLose();
        }
    }, [isGameWon, isGameOver, incorrectGuesses.length, playWin, playLose, updateScore]);

    return (
        <div className="flex flex-col items-center font-roboto-mono">
            <div className="mb-4 text-3xl tracking-[0.5em]">
                {word.split('').map((letter, i) => (
                    <span key={i} className="inline-block border-b-2 border-brand-secondary w-8 text-center mx-1">
                        {guessedLetters.includes(letter) ? letter : ''}
                    </span>
                ))}
            </div>
            <div className="mb-4">
                <p>Incorrect guesses: {incorrectGuesses.length} / 6</p>
            </div>
            {isGameOver ? (
                <p className="text-2xl text-brand-danger font-bold">You lose! The word was: {word}</p>
            ) : isGameWon ? (
                <p className="text-2xl text-brand-success font-bold">You win!</p>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(letter => (
                        <button key={letter} onClick={() => handleGuess(letter)} disabled={guessedLetters.includes(letter)} className="w-10 h-10 bg-brand-surface border border-brand-border rounded disabled:bg-brand-bg disabled:text-brand-secondary/50">
                            {letter}
                        </button>
                    ))}
                </div>
            )}
            {(isGameOver || isGameWon) && <button onClick={resetGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded">Play Again</button>}
        </div>
    );
};

// --- 10. Breakout ---
export const Breakout: React.FC<GameProps> = ({ updateScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const { playScore, playLose, playClick } = useSound();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let ball = { x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3, radius: 8 };
        let paddle = { x: canvas.width / 2 - 50, y: canvas.height - 15, width: 100, height: 10 };
        const bricks: {x: number, y: number, status: number}[][] = [];
        const brickRowCount = 4;
        const brickColumnCount = 6;
        const brickWidth = 75;
        const brickHeight = 20;
        const brickPadding = 10;
        const brickOffsetTop = 30;
        const brickOffsetLeft = 30;
        
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }

        const collisionDetection = () => {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    const b = bricks[c][r];
                    if (b.status === 1) {
                        if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                            ball.dy = -ball.dy;
                            b.status = 0;
                            playScore();
                            setScore(s => s + 10);
                        }
                    }
                }
            }
        };

        const drawBall = () => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#F8F8FF";
            ctx.fill();
            ctx.closePath();
        };

        const drawPaddle = () => {
            ctx.beginPath();
            ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
            ctx.fillStyle = "#C9D1D9";
            ctx.fill();
            ctx.closePath();
        };
        
        const drawBricks = () => {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    if(bricks[c][r].status === 1){
                        const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                        const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                        bricks[c][r].x = brickX;
                        bricks[c][r].y = brickY;
                        ctx.beginPath();
                        ctx.rect(brickX, brickY, brickWidth, brickHeight);
                        ctx.fillStyle = "#F778BA";
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBricks();
            drawBall();
            drawPaddle();
            collisionDetection();

            if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
                ball.dx = -ball.dx;
            }
            if (ball.y + ball.dy < ball.radius) {
                ball.dy = -ball.dy;
            } else if (ball.y + ball.dy > canvas.height - ball.radius - paddle.height) {
                if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                    playClick();
                    ball.dy = -ball.dy;
                } else {
                    playLose();
                    updateScore('breakout', score);
                    setGameOver(true);
                    return;
                }
            }
            
            ball.x += ball.dx;
            ball.y += ball.dy;

            requestAnimationFrame(draw);
        };
        
        const mouseMoveHandler = (e: MouseEvent) => {
            const relativeX = e.clientX - canvas.offsetLeft;
            if(relativeX > 0 && relativeX < canvas.width){
                paddle.x = relativeX - paddle.width / 2;
            }
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        
        draw();
        
        return () => document.removeEventListener('mousemove', mouseMoveHandler);

    }, [gameOver, playClick, playLose, playScore, score, updateScore]);

    if(gameOver) return <p className="text-center text-2xl font-orbitron text-brand-danger">Game Over! Final Score: {score}</p>;

    return (
        <div className="flex flex-col items-center">
             <h3 className="text-xl font-orbitron mb-2">Score: {score}</h3>
            <canvas ref={canvasRef} width="500" height="400" className="bg-brand-bg border border-brand-border rounded-lg"></canvas>
        </div>
    );
};

// --- 11. Quiz Game ---
export const QuizGame: React.FC<GameProps> = ({ updateScore }) => {
    const QUESTIONS = useMemo(() => [
        { q: "What does 'React' primarily manage in an application?", a: ["State and UI", "Database", "API calls"], correct: 0 },
        { q: "What is JSX?", a: ["A styling language", "A JavaScript syntax extension", "A database query language"], correct: 1 },
        { q: "Which hook is used to perform side effects in a function component?", a: ["useState", "useContext", "useEffect"], correct: 2 },
    ], []);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const { playScore, playLose, playWin } = useSound();

    const handleAnswer = (index: number) => {
        if (index === QUESTIONS[currentQuestion].correct) {
            playScore();
            setScore(s => s + 10);
        } else {
            playLose();
        }

        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(c => c + 1);
        } else {
            playWin();
            updateScore('quiz-game', score + (index === QUESTIONS[currentQuestion].correct ? 10 : 0));
            setIsFinished(true);
        }
    };
    
    if (isFinished) {
        return <div className="text-center"><p className="text-2xl font-orbitron">Quiz Complete! Your score: {score}</p></div>;
    }

    return (
        <div className="w-full max-w-lg mx-auto text-center">
            <h3 className="text-2xl font-orbitron mb-4">{QUESTIONS[currentQuestion].q}</h3>
            <div className="flex flex-col gap-3">
                {QUESTIONS[currentQuestion].a.map((option, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} className="p-3 bg-brand-surface border border-brand-border rounded hover:bg-brand-primary hover:text-black">
                        {option}
                    </button>
                ))}
            </div>
             <p className="mt-4 text-xl font-orbitron">Score: {score}</p>
        </div>
    );
};

// --- 12. Simon Says ---
export const SimonSays: React.FC<GameProps> = ({ updateScore }) => {
    const COLORS = ['green', 'red', 'yellow', 'blue'];
    const [sequence, setSequence] = useState<string[]>([]);
    const [playerSequence, setPlayerSequence] = useState<string[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [activeColor, setActiveColor] = useState('');
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const { playClick, playLose, playWin } = useSound();

    const nextRound = () => {
        setIsPlayerTurn(false);
        setPlayerSequence([]);
        const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const newSequence = [...sequence, newColor];
        setSequence(newSequence);
        
        newSequence.forEach((color, i) => {
            setTimeout(() => {
                setActiveColor(color);
                playClick(); // Or a specific sound per color
                setTimeout(() => setActiveColor(''), 300);
            }, (i + 1) * 600);
        });
        
        setTimeout(() => setIsPlayerTurn(true), newSequence.length * 600);
    };
    
    const handleColorClick = (color: string) => {
        if (!isPlayerTurn) return;
        playClick();
        setPlayerSequence(prev => [...prev, color]);
    };
    
    useEffect(() => {
        if (sequence.length > 0 && isPlayerTurn) {
            const currentMove = playerSequence.length - 1;
            if (playerSequence[currentMove] !== sequence[currentMove]) {
                playLose();
                setGameOver(true);
                updateScore('simon-says', score);
            } else if (playerSequence.length === sequence.length) {
                const newScore = score + 1;
                setScore(newScore);
                playWin(); // sound for level up
                setTimeout(nextRound, 1000);
            }
        }
    }, [playerSequence, sequence, isPlayerTurn, playLose, playWin, score, updateScore]);


    const startGame = () => {
        setGameOver(false);
        setScore(0);
        setSequence([]);
        setTimeout(nextRound, 500);
    };
    
    if (gameOver) return <div className="text-center text-brand-danger text-2xl font-orbitron">Game Over! Final Score: {score}</div>;

    return (
        <div className="flex flex-col items-center">
            {sequence.length === 0 ? (
                <button onClick={startGame} className="px-6 py-3 bg-brand-primary text-black rounded-lg text-lg">Start</button>
            ) : (
                <>
                <p className="text-xl mb-4 font-orbitron">Score: {score}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div onClick={() => handleColorClick('green')} className={`w-32 h-32 bg-green-500 rounded-tl-full transition-opacity ${activeColor === 'green' || !isPlayerTurn ? 'opacity-100' : 'opacity-50'}`}></div>
                    <div onClick={() => handleColorClick('red')} className={`w-32 h-32 bg-red-500 rounded-tr-full transition-opacity ${activeColor === 'red' || !isPlayerTurn ? 'opacity-100' : 'opacity-50'}`}></div>
                    <div onClick={() => handleColorClick('yellow')} className={`w-32 h-32 bg-yellow-500 rounded-bl-full transition-opacity ${activeColor === 'yellow' || !isPlayerTurn ? 'opacity-100' : 'opacity-50'}`}></div>
                    <div onClick={() => handleColorClick('blue')} className={`w-32 h-32 bg-blue-500 rounded-br-full transition-opacity ${activeColor === 'blue' || !isPlayerTurn ? 'opacity-100' : 'opacity-50'}`}></div>
                </div>
                </>
            )}
        </div>
    );
};

// --- 13. 2048 ---
const TILE_COLORS: Record<number, string> = {
  2: 'bg-gray-700 text-white',
  4: 'bg-gray-600 text-white',
  8: 'bg-orange-500 text-white',
  16: 'bg-orange-600 text-white',
  32: 'bg-red-500 text-white',
  64: 'bg-red-600 text-white',
  128: 'bg-yellow-500 text-black',
  256: 'bg-yellow-400 text-black',
  512: 'bg-yellow-300 text-black',
  1024: 'bg-indigo-400 text-white',
  2048: 'bg-indigo-500 text-white',
};

export const TwentyFortyEight: React.FC<GameProps> = ({ updateScore }) => {
    const SIZE = 4;
    const { playClick, playLose, playWin, playScore } = useSound();

    const createEmptyBoard = () => Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));

    const addRandomTile = (board: number[][]) => {
        let emptyTiles = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] === 0) {
                    emptyTiles.push({ r, c });
                }
            }
        }
        if (emptyTiles.length > 0) {
            const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            board[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
        return board;
    };

    const [board, setBoard] = useState(() => addRandomTile(addRandomTile(createEmptyBoard())));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const slideAndMerge = (row: number[]) => {
        let newRow = row.filter(tile => tile !== 0);
        let moveScore = 0;
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                moveScore += newRow[i];
                newRow.splice(i + 1, 1);
            }
        }
        while (newRow.length < SIZE) {
            newRow.push(0);
        }
        return { newRow, moveScore };
    };
    
    const rotateBoard = (currentBoard: number[][]) => {
        const newBoard = createEmptyBoard();
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                newBoard[r][c] = currentBoard[SIZE - 1 - c][r];
            }
        }
        return newBoard;
    };

    const move = (direction: 'up' | 'down' | 'left' | 'right') => {
        let currentBoard = JSON.parse(JSON.stringify(board));
        let tempBoard = JSON.parse(JSON.stringify(board));
        let totalMoveScore = 0;
        let rotations = 0;

        if (direction === 'up') rotations = 1;
        if (direction === 'right') rotations = 2;
        if (direction === 'down') rotations = 3;

        for (let i = 0; i < rotations; i++) {
            currentBoard = rotateBoard(currentBoard);
        }

        for (let r = 0; r < SIZE; r++) {
            const { newRow, moveScore } = slideAndMerge(currentBoard[r]);
            currentBoard[r] = newRow;
            totalMoveScore += moveScore;
        }

        for (let i = 0; i < (4 - rotations) % 4; i++) {
            currentBoard = rotateBoard(currentBoard);
        }
        
        const moved = JSON.stringify(tempBoard) !== JSON.stringify(currentBoard);

        if (moved) {
            if (totalMoveScore > 0) playScore();
            else playClick();
            
            const newBoard = addRandomTile(currentBoard);
            setBoard(newBoard);
            const newTotalScore = score + totalMoveScore;
            setScore(newTotalScore);
            updateScore('2048', newTotalScore);
        }
    };
    
    const checkForGameOver = (currentBoard: number[][]) => {
        for(let r=0; r<SIZE; r++){
            for(let c=0; c<SIZE; c++){
                if(currentBoard[r][c] === 0) return false;
                if(r < SIZE-1 && currentBoard[r][c] === currentBoard[r+1][c]) return false;
                if(c < SIZE-1 && currentBoard[r][c] === currentBoard[r][c+1]) return false;
            }
        }
        return true;
    }
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver) return;
            switch(e.key) {
                case 'ArrowLeft': move('left'); break;
                case 'ArrowRight': move('right'); break;
                case 'ArrowUp': move('up'); break;
                case 'ArrowDown': move('down'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        if(checkForGameOver(board)) {
            playLose();
            setGameOver(true);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [board, gameOver]);

    const resetGame = () => {
      playClick();
      setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
      setScore(0);
      setGameOver(false);
    }
    
    return (
        <div className="flex flex-col items-center">
            <div className="flex justify-between w-full max-w-sm mb-4">
                <h3 className="text-2xl font-orbitron">Score: {score}</h3>
                <button onClick={resetGame} className="px-3 py-1 bg-brand-surface border border-brand-border rounded">Reset</button>
            </div>
            <div className="bg-brand-bg p-2 rounded-lg grid grid-cols-4 gap-2 relative">
                {gameOver && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg animate-fadeIn z-10">
                        <p className="text-4xl font-orbitron text-brand-danger">Game Over!</p>
                        <button onClick={resetGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded">Play Again</button>
                    </div>
                )}
                {board.flat().map((tile, i) => (
                    <div key={i} className={`w-20 h-20 flex items-center justify-center rounded-md text-3xl font-bold transition-colors duration-200 ${TILE_COLORS[tile] || 'bg-brand-surface'}`}>
                        {tile > 0 ? tile : ''}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 14. Connect Four ---
export const ConnectFour: React.FC<GameProps> = ({ updateScore }) => {
    const ROWS = 6;
    const COLS = 7;
    const createEmptyGrid = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    const [grid, setGrid] = useState(createEmptyGrid());
    const [currentPlayer, setCurrentPlayer] = useState(1); // 1 for Red, 2 for Yellow
    const [winner, setWinner] = useState<number | null>(null);
    const { playClick, playWin } = useSound();

    const checkWin = (currentGrid: (number | null)[][]) => {
        // Horizontal, Vertical, and Diagonal checks
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (currentGrid[r][c]) {
                    if (c + 3 < COLS && currentGrid[r][c] === currentGrid[r][c+1] && currentGrid[r][c] === currentGrid[r][c+2] && currentGrid[r][c] === currentGrid[r][c+3]) return currentGrid[r][c];
                    if (r + 3 < ROWS && currentGrid[r][c] === currentGrid[r+1][c] && currentGrid[r][c] === currentGrid[r+2][c] && currentGrid[r][c] === currentGrid[r+3][c]) return currentGrid[r][c];
                    if (r + 3 < ROWS && c + 3 < COLS && currentGrid[r][c] === currentGrid[r+1][c+1] && currentGrid[r][c] === currentGrid[r+2][c+2] && currentGrid[r][c] === currentGrid[r+3][c+3]) return currentGrid[r][c];
                    if (r - 3 >= 0 && c + 3 < COLS && currentGrid[r][c] === currentGrid[r-1][c+1] && currentGrid[r][c] === currentGrid[r-2][c+2] && currentGrid[r][c] === currentGrid[r-3][c+3]) return currentGrid[r][c];
                }
            }
        }
        return null;
    };

    const handleColumnClick = (c: number) => {
        if (winner) return;
        playClick();
        const newGrid = grid.map(row => [...row]);
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!newGrid[r][c]) {
                newGrid[r][c] = currentPlayer;
                setGrid(newGrid);
                const win = checkWin(newGrid);
                if (win) {
                    playWin();
                    setWinner(win);
                    if (win === 1) updateScore('connect-four', 100);
                } else {
                    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
                }
                return;
            }
        }
    };

    const resetGame = () => {
        setGrid(createEmptyGrid());
        setCurrentPlayer(1);
        setWinner(null);
    };

    return (
        <div className="flex flex-col items-center">
            {winner ? <h3 className="text-2xl font-orbitron mb-2">Player {winner} wins!</h3> : <h3 className="text-xl font-orbitron mb-2">Player {currentPlayer}'s Turn</h3>}
            <div className="bg-blue-800 p-2 rounded-lg grid gap-1" style={{gridTemplateColumns: `repeat(${COLS}, 1fr)`}}>
                {grid.map((row, r) => row.map((cell, c) => (
                    <div key={`${r}-${c}`} onClick={() => handleColumnClick(c)} className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center cursor-pointer">
                       {cell && <div className={`w-10 h-10 rounded-full ${cell === 1 ? 'bg-red-500' : 'bg-yellow-400'}`}></div>}
                    </div>
                )))}
            </div>
            {winner && <button onClick={resetGame} className="mt-4 px-4 py-2 bg-brand-primary text-black rounded">Play Again</button>}
        </div>
    );
};

// --- 15. Clicker Game ---
export const ClickerGame: React.FC<GameProps> = ({ updateScore }) => {
    const [score, setScore] = useState(0);
    const [clickPower, setClickPower] = useState(1);
    const { playScore } = useSound();
    
    const handleClick = () => {
        playScore();
        const newScore = score + clickPower;
        setScore(newScore);
        updateScore('clicker-game', newScore);
    };

    const buyUpgrade = () => {
        if (score >= 10 * clickPower) {
            setScore(s => s - (10 * clickPower));
            setClickPower(p => p + 1);
        }
    };

    return (
        <div className="text-center">
            <h2 className="text-4xl font-orbitron mb-4">{score}</h2>
            <p className="mb-4">Power per click: {clickPower}</p>
            <button onClick={handleClick} className="px-8 py-4 bg-brand-primary text-black rounded-full text-2xl font-bold animate-pulseGlow mb-6">
                Click Me!
            </button>
            <div>
                <button onClick={buyUpgrade} disabled={score < 10 * clickPower} className="px-4 py-2 bg-brand-surface border border-brand-border rounded disabled:opacity-50">
                    Buy Upgrade (Cost: {10 * clickPower})
                </button>
            </div>
        </div>
    );
};

// --- MULTIPLAYER GAMES ---

// --- Multiplayer Tic Tac Toe ---
export const TicTacToeMultiplayer: React.FC<MultiplayerGameProps> = ({ user, match, onUpdateMatch }) => {
    const { playClick, playWin } = useSound();
    const { gameState, turn, winner, players } = match;
    const board = gameState.board;
    const isMyTurn = turn === user.email;

    const calculateWinnerMultiplayer = (squares: (string | null)[]) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
        }
        if (squares.every(Boolean)) return 'Draw';
        return null;
    };

    const handleClick = (i: number) => {
        if (winner || board[i] || !isMyTurn) return;
        playClick();
        
        const newBoard = board.slice();
        const mySymbol = players[0].email === user.email ? 'X' : 'O';
        newBoard[i] = mySymbol;
        
        const newWinner = calculateWinnerMultiplayer(newBoard);
        const nextTurn = players.find(p => p.email !== user.email)?.email || '';
        
        const updatedMatch = {
            ...match,
            gameState: { board: newBoard },
            turn: newWinner ? '' : nextTurn,
            winner: newWinner,
        };
        
        if (newWinner && newWinner !== 'Draw') {
            playWin();
        }

        onUpdateMatch(updatedMatch);
    };
    
    const getStatus = () => {
        if(winner) {
            if (winner === 'Draw') return 'It\'s a Draw!';
            const winnerSymbol = winner;
            const winnerUser = players.find((p, index) => (index === 0 && winnerSymbol === 'X') || (index === 1 && winnerSymbol === 'O'));
            return `${winnerUser?.username || 'Player'} Wins!`;
        }
        return isMyTurn ? 'Your Turn' : `Waiting for ${players.find(p=>p.email === turn)?.username}...`;
    };

    return (
        <div className="flex flex-col items-center p-4 font-roboto-mono">
            <h3 className="text-2xl font-orbitron mb-4">{getStatus()}</h3>
            <div className="grid grid-cols-3 gap-2">
                {board.map((value: string | null, i: number) => (
                    <button 
                        key={i} 
                        onClick={() => handleClick(i)} 
                        className={`w-24 h-24 bg-brand-surface border-2 border-brand-border text-4xl font-bold flex items-center justify-center text-brand-primary transition-colors ${isMyTurn && !value ? 'cursor-pointer hover:bg-brand-border' : 'cursor-not-allowed'}`}
                        disabled={!isMyTurn || !!value || !!winner}
                    >
                        {value}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Multiplayer Connect Four ---
export const ConnectFourMultiplayer: React.FC<MultiplayerGameProps> = ({ user, match, onUpdateMatch }) => {
    const { playClick, playWin } = useSound();
    const { gameState, turn, winner, players } = match;
    const grid = gameState.grid;
    const isMyTurn = turn === user.email;
    const ROWS = 6;
    const COLS = 7;

    const checkWin = (currentGrid: (number | null)[][]) => {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (currentGrid[r][c]) {
                    if (c + 3 < COLS && currentGrid[r][c] === currentGrid[r][c+1] && currentGrid[r][c] === currentGrid[r][c+2] && currentGrid[r][c] === currentGrid[r][c+3]) return currentGrid[r][c];
                    if (r + 3 < ROWS && currentGrid[r][c] === currentGrid[r+1][c] && currentGrid[r][c] === currentGrid[r+2][c] && currentGrid[r][c] === currentGrid[r+3][c]) return currentGrid[r][c];
                    if (r + 3 < ROWS && c + 3 < COLS && currentGrid[r][c] === currentGrid[r+1][c+1] && currentGrid[r][c] === currentGrid[r+2][c+2] && currentGrid[r][c] === currentGrid[r+3][c+3]) return currentGrid[r][c];
                    if (r - 3 >= 0 && c + 3 < COLS && currentGrid[r][c] === currentGrid[r-1][c+1] && currentGrid[r][c] === currentGrid[r-2][c+2] && currentGrid[r][c] === currentGrid[r-3][c+3]) return currentGrid[r][c];
                }
            }
        }
        if (currentGrid.flat().every(cell => cell !== null)) return 'Draw';
        return null;
    };
    
    const handleColumnClick = (c: number) => {
        if (winner || !isMyTurn || grid[0][c] !== null) return;
        playClick();

        const newGrid = grid.map((row: any[]) => [...row]);
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!newGrid[r][c]) {
                const playerNumber = players[0].email === user.email ? 1 : 2;
                newGrid[r][c] = playerNumber;
                
                const newWinner = checkWin(newGrid);
                const nextTurn = players.find(p => p.email !== user.email)?.email || '';

                // FIX: The winner from checkWin is a player number (1 or 2) or 'Draw'.
                // This converts the player number to the player's email to match the `Match.winner` type.
                let finalWinner: string | null = null;
                if (typeof newWinner === 'number') {
                    finalWinner = players[newWinner - 1].email;
                } else if (newWinner === 'Draw') {
                    finalWinner = 'Draw';
                }

                const updatedMatch = {
                    ...match,
                    gameState: { grid: newGrid },
                    turn: newWinner ? '' : nextTurn,
                    winner: finalWinner,
                };

                if (newWinner && newWinner !== 'Draw') playWin();

                onUpdateMatch(updatedMatch);
                return;
            }
        }
    };
    
    const getStatus = () => {
        if(winner) {
            if (winner === 'Draw') return 'It\'s a Draw!';
            // FIX: The `winner` from the match is an email string. Find the user by email.
            const winnerUser = players.find(p => p.email === winner);
            return `${winnerUser?.username || 'Player'} Wins!`;
        }
        return isMyTurn ? 'Your Turn' : `Waiting for ${players.find(p=>p.email === turn)?.username}...`;
    };

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-2xl font-orbitron mb-2">{getStatus()}</h3>
            <div className="bg-blue-800 p-2 rounded-lg grid gap-1" style={{gridTemplateColumns: `repeat(${COLS}, 1fr)`}}>
                {grid.map((row: (number|null)[], r: number) => row.map((cell: number | null, c: number) => (
                    <div key={`${r}-${c}`} onClick={() => handleColumnClick(c)} className={`w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center ${isMyTurn && grid[0][c] === null ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                       {cell && <div className={`w-10 h-10 rounded-full ${cell === 1 ? 'bg-red-500' : 'bg-yellow-400'}`}></div>}
                    </div>
                )))}
            </div>
        </div>
    );
};