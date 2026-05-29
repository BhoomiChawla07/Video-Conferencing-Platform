import express from 'express';
import {createServer} from 'node:http';

import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import mongoose from 'mongoose';
import { connectToSocket } from './controllers/socketManager.js';

import cors from 'cors';
import userRoutes from './routes/users.routes.js';




const app = express();
const httpServer = createServer(app);
const allowedOrigins = [process.env.FRONTEND_ORIGIN || 'https://video-conferencing-frontend-l4ep.onrender.com', 'http://localhost:3000'];
const io = connectToSocket(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
    },
});

app.set('port', process.env.PORT || 8001);
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({limit: '40kb'}));
app.use(express.urlencoded({limit: '40kb' , extended: true}));

app.use('/api/v1/users', userRoutes);

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

    httpServer.listen(app.get('port'), () => {
        console.log(`Server is running on port ${app.get('port')}`);
    });
};

    startServer();
