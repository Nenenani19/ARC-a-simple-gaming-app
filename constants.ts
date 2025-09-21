import { Game, Avatar, MultiplayerGame } from './types';
import { 
    TicTacToe, MemoryMatch, RockPaperScissors, Snake, TypingSpeed, WhackAMole, Minesweeper, ColorGuess, Hangman, Breakout, QuizGame, SimonSays, TwentyFortyEight, ConnectFour, ClickerGame,
    TicTacToeMultiplayer, ConnectFourMultiplayer
} from './games';
import {
    TicTacToeIcon, MemoryMatchIcon, RockPaperScissorsIcon, SnakeIcon, TypingSpeedIcon, WhackAMoleIcon, MinesweeperIcon, ColorGuessIcon, HangmanIcon, BreakoutIcon, QuizIcon, SimonSaysIcon, TwentyFortyEightIcon, ConnectFourIcon, ClickerIcon,
    SupermanIcon, IronmanIcon, ThorIcon, CaptainAmericaIcon, SpidermanIcon, HulkIcon, LokiIcon, UserIcon
} from './components/Icons';

export const AVATARS_DATA: Avatar[] = [
    { id: 'superman', name: 'Superman', Icon: SupermanIcon },
    { id: 'ironman', name: 'Iron Man', Icon: IronmanIcon },
    { id: 'thor', name: 'Thor', Icon: ThorIcon },
    { id: 'captain-america', name: 'Captain America', Icon: CaptainAmericaIcon },
    { id: 'spiderman', name: 'Spider-Man', Icon: SpidermanIcon },
    { id: 'hulk', name: 'Hulk', Icon: HulkIcon },
    { id: 'loki', name: 'Loki', Icon: LokiIcon },
    { id: 'default', name: 'Recruit', Icon: UserIcon },
];

export const GAMES_DATA: Game[] = [
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', description: 'Classic Xs and Os. Get three in a row to win.', Icon: TicTacToeIcon, component: TicTacToe },
  { id: 'memory-match', name: 'Memory Match', description: 'Flip cards and find all the matching pairs.', Icon: MemoryMatchIcon, component: MemoryMatch },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', description: 'The timeless hand game. Can you beat the computer?', Icon: RockPaperScissorsIcon, component: RockPaperScissors },
  { id: 'snake', name: 'Snake', description: 'Eat the food, grow your snake, and avoid the walls.', Icon: SnakeIcon, component: Snake },
  { id: 'typing-speed', name: 'Typing Speed Test', description: 'Test your typing skills. How many words per minute?', Icon: TypingSpeedIcon, component: TypingSpeed },
  { id: 'whack-a-mole', name: 'Whack-A-Mole', description: 'Test your reflexes! Whack the moles as they appear.', Icon: WhackAMoleIcon, component: WhackAMole },
  { id: 'minesweeper', name: 'Minesweeper', description: 'Clear the board without detonating any hidden mines.', Icon: MinesweeperIcon, component: Minesweeper },
  { id: 'color-guess', name: 'Color Guess', description: 'Guess the color based on its HEX or RGB code.', Icon: ColorGuessIcon, component: ColorGuess },
  { id: 'hangman', name: 'Hangman', description: 'Guess the word before you run out of chances.', Icon: HangmanIcon, component: Hangman },
  { id: 'breakout', name: 'Breakout', description: 'Break all the bricks with a ball and paddle.', Icon: BreakoutIcon, component: Breakout },
  { id: 'quiz-game', name: 'Quiz Game', description: 'Test your knowledge with a variety of trivia questions.', Icon: QuizIcon, component: QuizGame },
  { id: 'simon-says', name: 'Simon Says', description: 'Follow the pattern of lights and sounds.', Icon: SimonSaysIcon, component: SimonSays },
  { id: '2048', name: '2048', description: 'Slide tiles to combine numbers and reach 2048.', Icon: TwentyFortyEightIcon, component: TwentyFortyEight },
  { id: 'connect-four', name: 'Connect Four', description: 'Get four of your colored discs in a row to win.', Icon: ConnectFourIcon, component: ConnectFour },
  { id: 'clicker-game', name: 'Clicker Game', description: 'Click to earn points and buy upgrades.', Icon: ClickerIcon, component: ClickerGame },
];

export const MULTIPLAYER_GAMES_DATA: MultiplayerGame[] = [
    { id: 'tic-tac-toe-mp', name: 'Tic Tac Toe', Icon: TicTacToeIcon, component: TicTacToeMultiplayer },
    { id: 'connect-four-mp', name: 'Connect Four', Icon: ConnectFourIcon, component: ConnectFourMultiplayer },
];

export const GAME_INSTRUCTIONS: Record<string, { title: string; rules: string[] }> = {
    'tic-tac-toe': { title: "How to Play Tic Tac Toe", rules: ["Players take turns marking a space in a 3x3 grid.", "The first player to get 3 of their marks in a row (up, down, across, or diagonally) is the winner.", "You are 'X'. Good luck!"] },
    'memory-match': { title: "How to Play Memory Match", rules: ["Flip over two cards at a time.", "If the cards match, they stay face up.", "If they don't match, they are flipped back over.", "Match all the pairs with the fewest moves to win!"] },
    'rock-paper-scissors': { title: "How to Play Rock Paper Scissors", rules: ["Choose Rock, Paper, or Scissors.", "Rock crushes Scissors, Scissors cuts Paper, and Paper covers Rock.", "Win against the computer to score points."] },
    'snake': { title: "How to Play Snake", rules: ["Use the Arrow Keys to move the snake.", "Eat the red food to grow longer and score points.", "Avoid running into the walls or your own tail!"] },
    'typing-speed': { title: "How to Play Typing Speed Test", rules: ["Type the provided text into the input box.", "Your time starts when you type the first character.", "The game ends when you correctly type the entire text.", "Your score is your Words Per Minute (WPM)."] },
    'whack-a-mole': { title: "How to Play Whack-A-Mole", rules: ["Moles will pop up from the holes.", "Click on a mole to 'whack' it and score a point.", "You have 30 seconds to whack as many as you can."] },
    'minesweeper': { title: "How to Play Minesweeper", rules: ["Left-click a cell to reveal it.", "A number shows how many mines are adjacent to it.", "Right-click to flag a cell you think has a mine.", "Reveal all non-mine cells to win. Don't click a mine!"] },
    'color-guess': { title: "How to Play Color Guess", rules: ["A color will be displayed.", "Guess which of the provided HEX or RGB codes matches the color.", "Score points for each correct guess."] },
    'hangman': { title: "How to Play Hangman", rules: ["Guess letters to reveal the hidden word.", "Each incorrect guess adds a part to the hangman drawing.", "You have 6 wrong guesses before you lose.", "Guess the word to win!"] },
    'breakout': { title: "How to Play Breakout", rules: ["Use your mouse to move the paddle left and right.", "Bounce the ball off the paddle to break the bricks.", "Don't let the ball fall below your paddle!", "Clear all bricks to win."] },
    'quiz-game': { title: "How to Play Quiz Game", rules: ["Read the question and select the correct answer from the options.", "Score points for each correct answer.", "Answer as many questions as you can."] },
    'simon-says': { title: "How to Play Simon Says", rules: ["Simon will light up a sequence of colors.", "Your task is to repeat the sequence by clicking the colors in the same order.", "The sequence gets longer with each correct round."] },
    '2048': { title: "How to Play 2048", rules: ["Use the Arrow Keys to slide the tiles in a direction.", "Tiles with the same number merge into one when they touch.", "A new tile (either 2 or 4) appears after each move.", "Combine tiles to reach the 2048 tile to win!"] },
    'connect-four': { title: "How to Play Connect Four", rules: ["Players take turns dropping their colored discs into a column.", "The disc falls to the lowest available space in that column.", "The first player to get four of their discs in a row (horizontally, vertically, or diagonally) wins."] },
    'clicker-game': { title: "How to Play Clicker Game", rules: ["Click the main button to earn points.", "Use your points to buy upgrades that increase points per click or generate points automatically.", "Reach the highest score possible!"] },
};
