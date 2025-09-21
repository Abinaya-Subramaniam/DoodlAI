import React, { useRef, useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Brush, 
  Eraser, 
  Trophy, 
  Play,
  CheckCircle,
  XCircle,
  Sparkles,
  RotateCcw,
  Home
} from 'lucide-react';
import './App.css';

const CATEGORIES = ['cat', 'dog', 'house', 'tree', 'car', 'apple', 'banana', 'clock'];

const DrawingCanvas = ({ brushSize, isErasing, onCanvasReady }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 280;
    canvas.height = 280;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = isErasing ? 'white' : '#2c3e50';
    
    setContext(ctx);
    if (onCanvasReady) onCanvasReady(canvas);
  }, [brushSize, isErasing, onCanvasReady]);

  const startDrawing = (e) => {
    if (!context) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    
    context.closePath();
    setIsDrawing(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    startDrawing(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      draw(e.touches[0]);
    }
  };

  const handleTouchEnd = () => {
    stopDrawing();
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="drawing-canvas"
      />
    </div>
  );
};

function App() {
  const fileInputRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [brushSize, setBrushSize] = useState(10);
  const [isErasing, setIsErasing] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [targetCategory, setTargetCategory] = useState('');
  const [gameState, setGameState] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalRounds, setTotalRounds] = useState(5);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setApiStatus(data.model_loaded ? 'ready' : 'no-model');
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus('error');
    }
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('game-over');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setRound(1);
    setTimeLeft(60);
    setPrediction(null);
    
    setTimeout(() => {
      nextRound();
    }, 100);
  };

  const nextRound = () => {
    if (round >= totalRounds) {
      setGameState('game-over');
      return;
    }

    const randomIndex = Math.floor(Math.random() * CATEGORIES.length);
    setTargetCategory(CATEGORIES[randomIndex]);
    clearCanvas();
    setPrediction(null);
    setRound(prev => prev + 1);
  };

  const clearCanvas = () => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
  };

  const predictDrawing = async () => {
    if (apiStatus !== 'ready') {
      alert('API is not ready. Please make sure the backend is running.');
      return;
    }

    if (!canvas) {
      alert('Canvas not available');
      return;
    }

    setLoading(true);
    try {
      const imageData = canvas.toDataURL('image/png');
      
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.predictions && result.predictions.length > 0) {
        setPrediction(result.predictions[0]);
        
        if (gameState === 'playing' && result.predictions[0].category === targetCategory) {
          const points = Math.round(result.predictions[0].probability * 100);
          setScore(prev => prev + points);
          setGameState('round-complete');
        }
      }
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Prediction failed. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        
        predictDrawing();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const downloadDrawing = () => {
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'doodlai-drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const goToHome = () => {
    setGameState('idle');
    setPrediction(null);
  };

  const renderApiStatus = () => {
    const statusConfig = {
      'checking': { text: 'Checking API...', color: '#95a5a6' },
      'ready': { text: 'API Connected', color: '#2ecc71' },
      'no-model': { text: 'Model Not Loaded', color: '#f39c12' },
      'error': { text: 'API Error', color: '#e74c3c' }
    };
    
    const config = statusConfig[apiStatus] || statusConfig.error;
    
    return (
      <div className="api-status">
        <div className="status-dot" style={{ backgroundColor: config.color }}></div>
        <span>{config.text}</span>
      </div>
    );
  };

  const ToolsPanel = () => (
    <div className="tools-panel-compact">
      <div className="brush-controls-compact">
        <div className="brush-tools">
          <button 
            className={`tool-button ${!isErasing ? 'active' : ''}`}
            onClick={() => setIsErasing(false)}
            title="Draw"
          >
            <Brush size={16} />
          </button>
          <button 
            className={`tool-button ${isErasing ? 'active' : ''}`}
            onClick={() => setIsErasing(true)}
            title="Erase"
          >
            <Eraser size={16} />
          </button>
          <div className="brush-size-compact">
            <span className="brush-size-label">{brushSize}px</span>
            <input
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="brush-slider"
            />
          </div>
        </div>
        
        <div className="action-buttons-compact">
          <button className="action-button secondary" onClick={clearCanvas} title="Clear">
            <Trash2 size={16} />
          </button>
          <button className="action-button primary" onClick={predictDrawing} disabled={loading} title="Analyze">
            {loading ? (
              <div className="spinner-small"></div>
            ) : (
              <Sparkles size={16} />
            )}
          </button>
          <button 
            className="action-button secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
          >
            <Upload size={16} />
          </button>
          <button className="action-button secondary" onClick={downloadDrawing} title="Download">
            <Download size={16} />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );

  const PredictionDisplay = () => {
    if (!prediction) {
      return (
        <div className="prediction-display-compact empty">
          <div className="prediction-placeholder">
            <Sparkles size={32} color="#bdc3c7" />
            <h3>Draw something</h3>
            <p>AI will predict what it is</p>
          </div>
        </div>
      );
    }
    
    const confidence = Math.round(prediction.probability * 100);
    const isCorrect = gameState === 'playing' && prediction.category === targetCategory;
    
    return (
      <div className={`prediction-display-compact ${isCorrect ? 'correct' : ''}`}>
        <div className="prediction-header-compact">
          <h3>AI Prediction</h3>
          <div className="confidence-badge">{confidence}%</div>
        </div>
        
        <div className="prediction-content">
          <div className="prediction-result-compact">
            <span className="predicted-word">{prediction.category}</span>
            {isCorrect && <CheckCircle size={20} color="#2ecc71" />}
          </div>
          
          <div className="confidence-visual">
            <div className="confidence-bar-compact">
              <div 
                className="confidence-fill"
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
            <div className="confidence-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          
          {isCorrect && (
            <div className="correct-feedback">
              <CheckCircle size={16} />
              <span>Correct! +{confidence} points</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const GameInfo = () => (
    <div className="game-info-compact">
      <div className="score-board">
        <Trophy size={16} />
        <span>{score}</span>
      </div>
      <div className="round-info">
        Round {round}/{totalRounds}
      </div>
      <div className="time-left">
        {timeLeft}s
      </div>
    </div>
  );

  const StartScreen = () => (
    <div className="start-screen">
      <div className="welcome-card">
        <div className="app-logo">
          <Sparkles size={40} />
          <h1>DoodlAI</h1>
        </div>
        <p>Draw anything and let our AI guess what it is!</p>
        <div className="action-buttons-center">
          <button className="start-button" onClick={startGame} disabled={apiStatus !== 'ready'}>
            <Play size={20} />
            Start Game
          </button>
          <button className="start-button secondary" onClick={() => setGameState('drawing')}>
            Free Draw
          </button>
        </div>
      </div>
    </div>
  );

  const RoundComplete = () => (
    <div className="round-complete">
      <CheckCircle size={48} color="#2ecc71" />
      <h2>Great job!</h2>
      <p>You earned {Math.round(prediction?.probability * 100 || 0)} points</p>
      <button className="next-round-button" onClick={nextRound}>
        Next Round
      </button>
    </div>
  );

  const GameOver = () => (
    <div className="game-over">
      <h2>Game Over!</h2>
      <div className="final-score">
        <Trophy size={32} color="#f1c40f" />
        <span>Final Score: {score}</span>
      </div>
      <div className="game-over-actions">
        <button className="play-again-button" onClick={startGame}>
          <RotateCcw size={18} />
          Play Again
        </button>
        <button className="home-button" onClick={goToHome}>
          <Home size={18} />
          Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={goToHome}>
            <Sparkles size={24} />
            <h1>DoodlAI</h1>
          </div>
          {renderApiStatus()}
        </div>
      </header>

      <main className="app-main">
        {apiStatus === 'error' || apiStatus === 'no-model' ? (
          <div className="error-screen">
            <XCircle size={48} color="#e74c3c" />
            <h2>Backend Connection Issue</h2>
            <p>Please make sure the FastAPI backend is running on port 8000.</p>
            <button onClick={checkApiHealth} className="retry-button">
              Retry Connection
            </button>
          </div>
        ) : gameState === 'idle' ? (
          <StartScreen />
        ) : (
          <div className="game-interface-compact">
            {(gameState === 'playing' || gameState === 'drawing') && (
              <>
                {gameState === 'playing' && (
                  <>
                    <div className="game-header">
                      <div className="drawing-prompt-compact">
                        <h3>Draw: <span className="target-word">{targetCategory}</span></h3>
                      </div>
                      <GameInfo />
                    </div>
                  </>
                )}

                <div className="main-content-compact">
                  <div className="canvas-section-compact">
                    <DrawingCanvas 
                      brushSize={brushSize} 
                      isErasing={isErasing} 
                      onCanvasReady={setCanvas}
                    />
                    <ToolsPanel />
                  </div>
                  
                  <div className="prediction-section-compact">
                    <PredictionDisplay />
                  </div>
                </div>
              </>
            )}

            {gameState === 'round-complete' && <RoundComplete />}
            {gameState === 'game-over' && <GameOver />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;