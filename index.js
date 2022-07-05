const dotenv = require("dotenv").config();
const express = require("express");
const fileupload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mysql = require("mysql");
const http = require("http")
const socketController = require("./models/SocketController.Js");
const video = require("./tables/video");
const users = require("./tables/users");

const app = express();


const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer, {
  pingInterval: 25000,
  pingTimeout: 90000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  let current_room;
  socket.on('join-room', (data) => {
    socketController.addPlayerToRoom(socket, data);
    socket.join(data.room_id);
    current_room = data.room_id;
    io.to(data.room_id).emit('update-users', socketController.getGameState(data.room_id));
  })

  socket.on('disconnecting', function() {
    socketController.removePlayerFromRoom(socket, current_room);
    io.to(current_room).emit('update-users', socketController.getGameState(current_room));
  })

  socket.on('leave-room', (data) => {
    socketController.removePlayerFromRoom(socket, data.room_id);
    io.to(current_room).emit('update-users', socketController.getGameState(current_room));
  })

  socket.on('edit-config',(data)=>{
    socketController.editConfig(data);
    io.to(data.room_id).emit('update-config', socketController.getConfigFromRoom(data.room_id));
  })

  socket.on('edit-state', (data) => {
    socketController.editState(data);
    io.to(data.room_id).emit('update-state', socketController.getStateFromRoom(data.room_id));
  })

  socket.on('new-loop', (room_id) => {
    const currentState = socketController.getStateFromRoom(room_id);
    const newState = {
      ...currentState, 
      loop: currentState.loop + 1, 
      timestamp: new Date().getTime() 
    }
    socketController.editState({room_id, state_info: newState});
    io.to(room_id).emit('loop-started', socketController.getStateFromRoom(room_id));
  })

  socket.on('request-game', (room_id) => {
    console.log("request game", room_id, socketController.getGameState(room_id));
    io.to(room_id).emit('game-data', socketController.getGameState(room_id));
  })

  socket.on('start-game',(data) =>{
    socketController.initState(data.room_id);
    const currentState = socketController.getStateFromRoom(data.room_id);
    socketController.editState({room_id: data.room_id, state_info: {...currentState, loop: 1, timestamp: new Date().getTime() }});
    console.log(socketController.getGameState(data.room_id))
    socketController.editConfig(data);
    io.to(data.room_id).emit('game-started', socketController.getGameState(data.room_id))
  })

  socket.on('save-answer',(data) => {
    const currentState = socketController.getStateFromRoom(data.room_id);
    const currentUsers = socketController.getUsersFromRoom(data.room_id);
    console.log(currentState.ranks[currentvideo]);
    let points = 0;
    const videosRanks = currentState.videos.map(video=>{
      return video.rank;
    })
    
    if(data.answer === videosRanks[currentvideo]){
       points = currentUsers.length + 1 - currentState.alreadyAnswered;
    }
    let answered = currentState.alreadyAnswered + 1;
    
    const users = currentUsers.map(user=>{
      return user.id;
    })

    const searchedUser = users.find((u) => u.id === data.user_id);
    
    socketController.editState({room_id: data.room_id, state_info: {...currentState, alreadyAnswered:answered}});
    socketController.editUsers({room_id: data.room_id, users: [...currentUsers, {...searchedUser, waiting: false, points}]})
    io.to(data.room_id).emit('answer-saved',{users: data.user_id})
  })
});


const port = 5000;
const db = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.enable('trust proxy');
app.use(cors({
    origin: [process.env.ORIGIN],
    methods: ["GET","POST", "DELETE", "PUT"],
    credentials: true
}));
app.use(fileupload());
app.use(express.static("files"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(session({
    key: "session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.ENVIRONMENT!=="dev",
        maxAge: 1000 * 60 * 60 * 24 //1000 = 1 seconde
    }
}));

require("./tables/video")(app,db);
require("./tables/users")(app,db);
require("./tables/rooms")(app,db);
require("./knex/buildDB")(app);
require("./cloudinary")(app);

httpServer.listen(port, () => console.log(`Listen on port ${port}`));