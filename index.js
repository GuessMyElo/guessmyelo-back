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
    let points = 0;
    const videosRanks = currentState.videos.map(video=>{
      return video.rank;
    })
    console.log(data.answer,videosRanks[currentState.current_video]);
    if(data.answer === videosRanks[currentState.current_video]){
      console.log(currentUsers.length, currentState.alreadyAnswered);
       points += currentUsers.length + 1 - currentState.alreadyAnswered;
       console.log("win");
    }
    console.log("points:",points);
    let answered = currentState.alreadyAnswered + 1;


    const newUsers= currentUsers.map(user =>{
        if(user.id=== data.user_id){
            if (!user.answers) user.answers = [];
            user.answers.push(data.answer)
            user.answered = true;
            user.points = points
        }
        return user;
    })
    
    socketController.editState({room_id: data.room_id, state_info: {...currentState, alreadyAnswered:answered}});
    socketController.editUsers({room_id: data.room_id, users:newUsers})
    io.to(data.room_id).emit('answer-saved',{users: socketController.getUsersFromRoom(data.room_id)})
  })

  // socket.on('')

  socket.on('next-video', (room_id) => {
    const currentState = socketController.getStateFromRoom(room_id);
    socketController.editState({room_id, state_info : {...currentState, loop : 1, timestamp : new Date().getTime(), current_video : currentState.current_video + 1}})
    const users = socketController.getUsersFromRoom(room_id);
    socketController.editUsers({ room_id, users: users.map((user) => {
      if (!user.answers) user.answers = [];
      if (!user.answers[currentState.current_video]) {
        user.answers.push(null);
      }
      return user;
    }) })

    console.log(socketController.getUsersFromRoom(room_id));
    io.to(room_id).emit('game-data', socketController.getGameState(room_id));
  })

  socket.on('reset-user-state', (room_id) => {
    console.log(room_id)
    const currentUsers = socketController.getUsersFromRoom(room_id);
    const newUsers= currentUsers.map(user =>{
            user.answered = false;
        return user;
    })
    socketController.editUsers({room_id, users:newUsers})
    io.to(room_id).emit('user-state-reseted', {users: socketController.getUsersFromRoom(room_id)});
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