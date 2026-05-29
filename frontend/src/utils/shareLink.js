import server from "../environment";

/**
 * Get a shareable meeting link with IP address
 * Falls back to localhost if IP cannot be determined
 */
export const getShareableMeetingLink = async (meetingId) => {
    try {
        const response = await fetch(`${server}/api/v1/server-info`);
        const data = await response.json();
        return `http://${data.ip}:3000/meeting/${meetingId}`;
    } catch (error) {
        console.log('Using localhost link:', error.message);
        return `http://localhost:3000/meeting/${meetingId}`;
    }
};

/**
 * Copy text to clipboard and show feedback
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
};
