const dotenv = require("dotenv").config();
const express = require("express");
const fileupload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mysql = require("mysql");
const http = require("http")
const socketController = require("./models/SocketController.Js");

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
    console.log("edit state")
    socketController.editState(data);
    io.to(data.room_id).emit('update-config', socketController.getStateFromRoom(data.room_id));
  })

  socket.on('request-game', (room_id) => {
    io.to(room_id).emit('game-data', socketController.getGameState(room_id));
  })

  socket.on('start-game',(data) => {
    socketController.initState(data.room_id);
    socketController.editConfig(data);
    io.to(data.room_id).emit('game-started')
  })

  socket.on('save-answer',(data) => {
    io.to(data.room_id).emit('answer-saved')
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