let IS_PROD = true;
const server = IS_PROD ?
    "https://video-conferencing-backend-mvi4.onrender.com" :

    "http://localhost:8000"


export default server;