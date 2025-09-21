from fastapi import FastAPI, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Doodle Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CATEGORIES = ['cat', 'dog', 'house', 'tree', 'car', 'apple', 'banana', 'clock']
model = None

@app.on_event("startup")
async def load_model():
    """Load the model on startup"""
    global model
    try:
        model = tf.keras.models.load_model('best_doodle_model.h5')
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise RuntimeError("Could not load model")

def preprocess_image(image_data):
    """Preprocess image for model prediction"""
    try:
        if isinstance(image_data, str) and image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        image = Image.open(io.BytesIO(image_bytes)).convert('L')  
        image = image.resize((28, 28))
        
        img_array = np.array(image) / 255.0
        img_array = img_array.reshape(1, 28, 28, 1)
        
        return img_array
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image data")

@app.get("/")
async def root():
    return {"message": "Doodle Recognition API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict")
async def predict_doodle(image_data: dict):
    """Predict doodle from image data"""
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        if 'image' not in image_data:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        img_array = preprocess_image(image_data['image'])
        
        prediction = model.predict(img_array, verbose=0)
        probabilities = prediction[0].tolist()
        
        results = []
        for i, prob in enumerate(probabilities):
            results.append({
                "category": CATEGORIES[i],
                "probability": float(prob)
            })
        
        results.sort(key=lambda x: x["probability"], reverse=True)
        
        return JSONResponse(content={
            "predictions": results[:5], 
            "top_prediction": results[0] if results else None
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-file")
async def predict_doodle_file(file: bytes = File(...)):
    """Predict doodle from uploaded file"""
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        image_data = base64.b64encode(file).decode('utf-8')
        return await predict_doodle({"image": f"data:image/png;base64,{image_data}"})
        
    except Exception as e:
        logger.error(f"File prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"File prediction failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)