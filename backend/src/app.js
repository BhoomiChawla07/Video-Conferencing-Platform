import express from 'express';
import {createServer} from 'node:http';
import os from 'os';


import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import mongoose from 'mongoose';
import { connectToSocket } from './controllers/socketManager.js';

import cors from 'cors';
import userRoutes from './routes/users.routes.js';




const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
    process.env.FRONTEND_ORIGIN || 'https://video-conferencing-frontend-l4ep.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    "https://tweezers-borrowing-phonebook.ngrok-free.dev"
];

// Socket.io already allows any origin in socketManager; keep default options here
const io = connectToSocket(httpServer, {});

app.set('port', process.env.PORT || 8001);
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
    origin: isDev ? true : (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https?:\/\/(192\.168\.|127\.|10\.)/.test(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({limit: '40kb'}));
app.use(express.urlencoded({limit: '40kb' , extended: true}));

app.use('/api/v1/users', userRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get server IP address
app.get('/api/v1/server-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    let ipAddress = 'localhost';
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ipAddress = iface.address;
                break;
            }
        }
    }
    
    res.json({ 
        ip: ipAddress, 
        port: app.get('port'),
        url: `http://${ipAddress}:${app.get('port')}`
    });
});

const startServer = async () => {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
        console.error('Missing MONGO_URI environment variable. Add it to backend/.env or export it before starting the app.');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, {
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }

    httpServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            const port = app.get('port');
            console.error(`Port ${port} is already in use. Stop the existing process or set a different PORT in your environment.`);
            process.exit(1);
        }
        throw error;
    });

    httpServer.listen(app.get('port'), '0.0.0.0', () => {
        console.log(`Server is running on port ${app.get('port')} at http://0.0.0.0:${app.get('port')}`);
        console.log(`Your local IP addresses:`);
        console.log(`  - http://localhost:${app.get('port')}`);
        // Get local IP
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`  - http://${iface.address}:${app.get('port')}`);
                }
            }
        }
    });
};

    startServer();
