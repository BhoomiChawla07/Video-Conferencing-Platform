let IS_PROD = false;

// Determine backend server at runtime so frontend and guests use the same host/IP
// Priority: REACT_APP_BACKEND_URL env var -> same host as page (hostname) -> localhost fallback
const runtimeHost = window?.location?.hostname || 'localhost';
const runtimeProtocol = window?.location?.protocol || 'http:';

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL;
const backendUrl = typeof rawBackendUrl === 'string' ? rawBackendUrl.trim() : rawBackendUrl;

// const server = backendUrl || (
//     IS_PROD
//         ? "https://video-conferencing-backend-mvi4.onrender.com"
//         : `${runtimeProtocol}//${runtimeHost}:8001`
// );
const server = "https://video-conferencing-backend-mvi4.onrender.com"

export default server;