const dotenv = require("dotenv").config();
const express = require("express");
const fileupload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mysql = require("mysql");
const http = require("http")

const app = express();


const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer, {
  pingInterval: 25000,
  pingTimeout: 90000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});;

let users = {}
io.on('connection', (socket) => {
  console.log("user connected")
  let current_room;
  socket.on('join-room', (data) => {
    console.log('join room')
    if (!users[data.room_id]) users[data.room_id] = [];
    users[data.room_id].push({socket_id: socket.id, ...data.user});
    socket.join(data.room_id);
    current_room = data.room_id,
    io.to(data.room_id).emit('update-users', users[data.room_id]);
  })

  socket.on('disconnecting', function() {
    console.log('leave room')
    if (current_room) {
      const userIndex = users[current_room].findIndex((u) => u.socket_id === socket.id);
      if (userIndex > -1) {
        users[current_room].splice(userIndex, 1);
        socket.leave(current_room);
        io.to(current_room).emit('update-users', users[current_room]);
      }
    }
  })

  socket.on('leave-room', (data) => {
    console.log('leave room')
    const userIndex = users[data.room_id].findIndex((u) => u.socket_id === socket.id);
    if (userIndex > -1) {
      users[data.room_id].splice(userIndex, 1);
      socket.leave(data.room_id);
      io.to(data.room_id).emit('update-users', users[data.room_id]);
    }
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