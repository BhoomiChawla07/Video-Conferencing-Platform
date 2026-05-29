import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext();

const client = axios.create({
    baseURL: `${server}/api/v1/users`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 10 second timeout
})

export const AuthProvider = ({ children }) => {

    const [userData, setUserData] = useState(null);
    const router = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('meetSyncUser');
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }
    }, []);

    const handleRegister = async (name, username, password) => {
        try {
            let response = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })
            if (response.status === 201) {
                return response.data.message;
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    const sendRegistrationOtp = async (name, username, password) => {
        try {
            const response = await client.post("/register/request-otp", {
                name,
                username,
                password,
            });
            if (response.status === 200) {
                return response.data.message;
            }
        } catch (err) {
            // Axios “Network Error” often means: unreachable server, CORS blocked, or blocked mixed-content.
            // Log enough details to differentiate without changing API behavior.
            // eslint-disable-next-line no-console
            console.error('sendRegistrationOtp failed:', {
                message: err?.message,
                code: err?.code,
                status: err?.response?.status,
                responseData: err?.response?.data,
                isAxiosError: !!err?.isAxiosError,
                errName: err?.name,
            });

            if (!err?.response) {
                // No response from backend => likely network/CORS/mixed-content.
                // eslint-disable-next-line no-console
                console.error('sendRegistrationOtp: no response received (likely CORS or backend unreachable).');
            }

            throw err;
        }
    };

    const verifyRegistrationOtp = async (username, otp) => {
        try {
            const response = await client.post("/register/verify-otp", {
                username,
                otp,
            });
            if (response.status === 200) {
                return response.data.message;
            }
        } catch (err) {
            console.log(err);
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            let response = await client.post("/login", {
                username,
                password
            })
            if (response.status === 200) {
                const currentUser = response.data.user;
                setUserData(currentUser);
                localStorage.setItem('token', 'meetSync-auth');
                localStorage.setItem('meetSyncUser', JSON.stringify(currentUser));
                localStorage.setItem('meetSyncUserId', currentUser.id);
                router("/home");
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

   const getUserHistory = async (userId) => {
        try {
            const id = userId || localStorage.getItem('meetSyncUserId');
            let response = await client.get(`/get_all_activity/${id}`);

            if (response.status === 200) {
                return response.data.history || [];
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            const id = userData?.id || localStorage.getItem('meetSyncUserId');
            if (!id) return;
            let response = await client.post(`/add_to_activity/${id}`, {
                meetingCode
            });
            if (response.status === 200) {
                return response.data.message;
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('meetSyncUser');
        localStorage.removeItem('meetSyncUserId');
        setUserData(null);
        router('/auth');
    }

    const data = {
        userData,
        setUserData,
        handleRegister,
        sendRegistrationOtp,
        verifyRegistrationOtp,
        handleLogin,
        getUserHistory,
        addToUserHistory,
        logout
    }
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}