// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login'; 
import Register from './components/Register'; 
import axios from 'axios';

const BOARD_SIZE = 10;
const INITIAL_SNAKE = [{ x: 2, y: 2 }];
const DIRECTIONS = {
  ArrowUp: { x: -1, y: 0 },
  ArrowDown: { x: 1, y: 0 },
  ArrowLeft: { x: 0, y: -1 },
  ArrowRight: { x: 0, y: 1 },
};

const getRandomFoodPosition = () => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE),
});

const App = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(getRandomFoodPosition());
  const [direction, setDirection] = useState(DIRECTIONS.ArrowRight);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
  });
  const [showHappyBombs, setShowHappyBombs] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Authentication state
  const [user, setUser] = useState(null);

  // Handle login success
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    fetchScores(); // Fetch scores after login
  };

  // Fetch high score and past scores after login
  const fetchScores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/game/get-scores', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const serverHighScore = response.data.highScore;
      const storedHighScore = parseInt(localStorage.getItem('highScore')) || 0;
      setHighScore(Math.max(serverHighScore, storedHighScore));
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  // Save high score to server
  const saveHighScoreToServer = async (newHighScore) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/game/save-score', { highScore: newHighScore }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };

  // Handle Key Presses
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (DIRECTIONS[event.key]) {
        setDirection(DIRECTIONS[event.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    if (isGameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const newHead = {
          x: (prevSnake[0].x + direction.x + BOARD_SIZE) % BOARD_SIZE,
          y: (prevSnake[0].y + direction.y + BOARD_SIZE) % BOARD_SIZE,
        };

        // Check for collisions (self)
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];
        if (newHead.x === food.x && newHead.y === food.y) {
          setFood(getRandomFoodPosition());
          setScore(score + 1);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 200);
    return () => clearInterval(interval);
  }, [snake, direction, food, isGameOver, score, highScore]);

  const handleGameOver = () => {
    setIsGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('highScore', score);
      saveHighScoreToServer(score); // Save to server
      setShowHappyBombs(true); // Show happy bombs
      setShowCongratsModal(true); // Show congratulatory modal
    }
  };

  const handleRestart = () => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFoodPosition());
    setDirection(DIRECTIONS.ArrowRight);
    setIsGameOver(false);
    setScore(0);
    setShowHappyBombs(false); // Hide happy bombs when restarting
    setShowCongratsModal(false); // Hide congratulatory modal
  };

  // Handle key press to trigger restart with Enter
  useEffect(() => {
    const handleEnterKey = (event) => {
      if (event.key === 'Enter' && isGameOver) {
        handleRestart();
      }
    };
    window.addEventListener('keydown', handleEnterKey);
    return () => {
      window.removeEventListener('keydown', handleEnterKey);
    };
  }, [isGameOver]);

  // If user is not logged in, show login and register forms
  if (!user) {
    return (
      <div className="app-container">
        <h1>Welcome to Snake Game</h1>
        <Register onRegisterSuccess={handleLoginSuccess} />
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Main game interface (if logged in)
  return (
    <div className="app-container">
      <h1 className="title">Snake Game</h1>
      <div className="scoreboard">
        <span className="score">Score: {score}</span>
        <span className="high-score">High Score: {highScore}</span>
      </div>

      {isGameOver && (
        <div className="game-over-overlay">
          <h2>Game Over!</h2>
          <button className="restart-btn" onClick={handleRestart}>Restart</button>
        </div>
      )}

      {showCongratsModal && (
        <div className="congrats-modal">
          <div className="congrats-content">
            <h2>Congratulations!</h2>
            <p>You've set a new high score!</p>
            <button className="close-btn" onClick={() => setShowCongratsModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showHappyBombs && (
        <div className="happy-bombs">
          <div className="happy-bomb left" />
          <div className="happy-bomb right" />
        </div>
      )}

      <div className="board">
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <div key={row} className="row">
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              const isHead = snake[0].x === row && snake[0].y === col; // Head (mouth)
              const isSnake = snake.some((segment) => segment.x === row && segment.y === col);
              const isFood = food.x === row && food.y === col;
              return (
                <div
                  key={col}
                  className={`cell 
                    ${isHead ? 'snake-head' : ''} 
                    ${isSnake && !isHead ? 'snake-body' : ''} 
                    ${isFood ? 'food' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
