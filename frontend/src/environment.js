let IS_PROD = false;
const server = IS_PROD ? 
    "https://video-conferencing-backend-mvi4.onrender.com" :
    "http://localhost:8002"

export default server;