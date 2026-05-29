import server from "../environment";

export const testBackendConnection = async () => {
    console.log("🔍 Testing backend connection...");
    console.log("Backend URL:", server);
    
    try {
        const response = await fetch(`${server}/api/v1/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Backend is running:", data);
            return { status: 'OK', data };
        } else {
            console.error("❌ Backend returned status:", response.status);
            return { status: 'ERROR', error: `HTTP ${response.status}` };
        }
    } catch (error) {
        console.error("❌ Cannot reach backend:", error.message);
        console.error("Make sure:");
        console.error("  1. Backend is running: npm start (in backend folder)");
        console.error("  2. MONGO_URI environment variable is set");
        console.error("  3. Port 8001 is not blocked");
        console.error("  4. Backend URL is correct:", server);
        return { status: 'ERROR', error: error.message };
    }
};
