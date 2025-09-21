# 🎨 DoodlAI - AI-Powered Doodle Recognition Game ![DoodlAI Demo](https://img.shields.io/badge/Demo-Live-success) ![Python](https://img.shields.io/badge/Python-3.8%2B-blue) ![React](https://img.shields.io/badge/React-18.0%2B-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-green) ![TensorFlow](https://img.shields.io/badge/TensorFlow-2.13%2B-orange) DoodlAI is an interactive web application that uses machine learning to recognize hand-drawn doodles in real-time. Draw anything and watch as our AI model predicts what you've created! ## ✨ Features - 🎯 **Real-time Doodle Recognition**: Draw on the canvas and get instant AI predictions - 🎮 **Interactive Game Mode**: Challenge yourself to draw specific prompts against the clock - 🖌️ **Drawing Tools**: Adjustable brush sizes, eraser, and color options - 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices - 📊 **Confidence Scoring**: See how confident the AI is in its predictions - 💾 **Save & Share**: Download your drawings and share them with others - 🏆 **Scoring System**: Earn points based on drawing accuracy and speed ## 🏗️ Architecture DoodlAI is built with a modern full-stack architecture: DoodlAI/ ├── backend/ # FastAPI server with TensorFlow model │ ├── app.py # Main API server │ ├── requirements.txt # Python dependencies │ └── best_doodle_model.h5 # Trained ML model ├── frontend/ # React application │ ├── public/ # Static assets │ ├── src/ # React components │ └── package.json # Node.js dependencies └── README.md # This file ## 🚀 Quick Start ### Prerequisites - Python 3.8 or higher - Node.js 16 or higher - npm or yarn ### Installation 1. **Clone the repository**
bash
   git clone https://github.com/Abinaya-Subramaniam/DoodlAI.git
   cd DoodlAI
2. **Set up the Backend**
bash
   cd backend
   pip install -r requirements.txt
3. **Set up the Frontend**
bash
   cd ../frontend
   npm install
4. **Start the Backend Server**
bash
   cd backend
   python app.py
5. **Start the Frontend Development Server**
bash
   cd frontend
   npm start
#### 🎮 How to Play #### Game Mode 1. Click **"Start Game"** from the home screen. 2. You'll be given a word to draw (e.g., "cat", "house"). 3. Use the canvas to draw the prompt within the time limit. 4. Click **"Analyze"** to let the AI guess your drawing. 5. Earn points based on accuracy and speed. 6. Complete all rounds to achieve a high score! #### Free Draw Mode 1. Select **"Free Draw"** from the home screen. 2. Draw anything you like on the canvas. 3. Use the tools to adjust brush size or erase. 4. Click **"Analyze"** at any time to see what the AI thinks you've drawn. 5. Download your masterpiece when you're done. --- ### 🛠️ Technology Stack #### Backend - **FastAPI**: Modern, fast web framework for building APIs - **TensorFlow**: Machine learning framework for model inference - **Uvicorn**: ASGI server for running FastAPI applications - **Pillow**: Image processing library #### Frontend - **React**: JavaScript library for building user interfaces - **Lucide React**: Beautiful & consistent icon toolkit - **CSS3**: Modern styling with Flexbox and Grid layouts #### Machine Learning - **Custom CNN Model**: Trained on Google QuickDraw dataset - **TensorFlow/Keras**: Model architecture and training - **8 Categories**: cat, dog, house, tree, car, apple, banana, clock --- ### 🔧 API Endpoints | Endpoint | Method | Description | |-----------------|--------|-----------------------------------| | / | GET | Health check and API information | | /health | GET | Service health status | | /predict | POST | Analyze an image and return predictions | | /predict-file | POST | Analyze uploaded image file |
