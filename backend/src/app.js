import express from 'express';
import {createServer} from 'node:http';

import { Server } from 'socket.io';

import mongoose from 'mongoose';
import { connectToSocket } from './controllers/socketManager.js';

import cors from 'cors';
import userRoutes from './routes/users.routes.js';




const app = express();
const httpServer = createServer(app);
const io = connectToSocket(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

app.set('port', process.env.PORT || 8000);
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json({limit: '40kb'}));
app.use(express.urlencoded({limit: '40kb' , extended: true}));

app.use('/api/v1/users', userRoutes);

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }

    httpServer.listen(app.get("port"), () => {
        console.log('Server is running on port 8000');
    });
};

    startServer();
