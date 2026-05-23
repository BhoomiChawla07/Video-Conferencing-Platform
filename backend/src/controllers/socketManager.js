import { Server } from 'socket.io';

let connections = {}
let messages = {}
let timeOnline = {}



export const connectToSocket = (httpServer, options) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],   
            allowedHeaders: ['*'],
            credentials: true
        },
    });

    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.id);
        socket.on('joinRoom', (path) => {
           if (!connections[path]) {
                connections[path] = [];
           }

           const existingUsers = [...connections[path]];
           connections[path].push(socket.id);
           timeOnline[socket.id] = Date.now();

           io.to(socket.id).emit('all-users', existingUsers);

           existingUsers.forEach((id) => {
                io.to(id).emit('user-joined', socket.id);
           });

           if (messages[path] !== undefined) {
            for (let i = 0; i < messages[path].length; i++) {
                io.to(socket.id).emit('chat-message', messages[path][i]["data"], messages[path][i]["socket-id-sender"]);
            }
           }
        });

        socket.on("signal", (toId, message) => {
            socket.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
            .reduce(([room, isFound], [roomkey, roomValue]) => {
               if(!isFound && roomValue.includes(socket.id)) {
                    return [roomkey, true];
                }
                return [room, isFound];

            }, [null, false]);

            if(found === true) {
                if(messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({"data": data, "socket-id-sender": sender});

                connections[matchingRoom].forEach((id) => {
                    if(id !== socket.id) {
                        io.to(id).emit("chat-message", data, sender, socket.id);
                    }
                });
            }
        });

            socket.on('disconnect', () => {
                var diffTime = Math.abs(timeOnline[socket.id] - Date.now());
                delete timeOnline[socket.id];
                

                var key

                for(const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                    for(let i = 0; i < v.length; i++) {
                        if(v[i] === socket.id) {
                            key = k;
                            const roomConnections = connections[key] || [];

                            for(let j = 0; j < roomConnections.length; j++) {
                                if(roomConnections[j] !== socket.id) {
                                    io.to(roomConnections[j]).emit("user-left", socket.id);
                                }
                            }

                            var index = roomConnections.indexOf(socket.id);
                            if (index > -1) {
                                roomConnections.splice(index, 1);
                            }

                            if(roomConnections.length === 0) {
                                delete connections[key];
                                delete messages[key];
                            } else {
                                connections[key] = roomConnections;
                            }

                            break;
                        }
                    }
                }
            });
    });
        

    return io;
};


