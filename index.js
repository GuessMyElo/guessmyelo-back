const dotenv = require("dotenv").config();
const express = require("express");
const fileupload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const http = require("http")
const socketController = require("./models/SocketController.Js");
const {getUserAnswers} = require("./functions.js")

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
    io.to(room_id).emit('game-data', socketController.getGameState(room_id));
  })

  socket.on('start-game', async (data) =>{
    socketController.editConfig(data);
    await socketController.initState(data.room_id);
    const currentState = socketController.getStateFromRoom(data.room_id);
    socketController.editState({room_id: data.room_id, state_info: {...currentState, step : "game", loop: 1, timestamp: new Date().getTime() }});
    socketController.editConfig(data);
    io.to(data.room_id).emit('game-started', socketController.getGameState(data.room_id))
  })

  socket.on('save-answer',(data) => {
    const currentState = socketController.getStateFromRoom(data.room_id);
    const currentUsers = socketController.getUsersFromRoom(data.room_id);
    // let points = 0;
    // const videosRanks = currentState.videos.map(video=>{
    //   return video.rank;
    // })
    // if(data.answer === videosRanks[currentState.current_video]){
    //    points += currentUsers.length + 1 - currentState.alreadyAnswered;
    // }
    let answered = currentState.alreadyAnswered + 1;


    const newUsers= currentUsers.map(user =>{
        if(user.id === data.user_id){
            if (!user.answers) user.answers = [];
            user.answers.push({answer:data.answer, timestamp:new Date().getTime()})
            user.answered = true;
            // user.points = points;
        }
        return user;
    })
    socketController.editState({room_id: data.room_id, state_info: {...currentState, alreadyAnswered:answered}});
    socketController.editUsers({room_id: data.room_id, users:newUsers})
    // console.log("getUserFromRoom: ",socketController.getUsersFromRoom(data.room_id));
    io.to(data.room_id).emit('answer-saved',{users: socketController.getUsersFromRoom(data.room_id)})
  })

  socket.on('calcul-point',async (room_id) =>{
    const currentState = socketController.getStateFromRoom(room_id);
    let currentUsers = socketController.getUsersFromRoom(room_id);

    const userAnswers = JSON.parse(await getUserAnswers(room_id));
    console.log("FETCH ANSWERS : ",userAnswers);
    const videosRanks = currentState.videos.map(video=>{
      return video.rank;
    })
    // On initialise les points à 0 pour chaque user
    currentUsers = currentUsers.map((user) => {
      user.points = 0;
      return user;
    })

    // On parcoure les réponses des vidéos
    videosRanks.map((rank, index) => {
      // On parcourt les réponses des utilisateurs
      console.log("RANK : ", rank);
      
      Object.entries(userAnswers).map(([userId, answers]) => {
        // Si la réponse de l'utilisateur est correcte
        const timestamps = answers.map((e) => ({userId, timestamp : e.timestamp})).sort((a, b) => b.timestamp - a.timestamp);
        console.log("TIMESTAMPS ", timestamps);

        if (answers[index].answer === rank) {
          console.log("FOUND");
          const bonusPoints = timestamps.findIndex((e) => {
            console.log(e.userId);
            console.log(userId);
            console.log(e.userId === userId);
            return e.userId === userId
          });
          console.log(userId," BONUS ", bonusPoints);
          currentUsers = currentUsers.map(user => {
            if(user.id === userId) user.points += 3 + bonusPoints;
            return user;
          })
        }
      })
    })

    socketController.editUsers({room_id, users:currentUsers})
    io.to(room_id).emit('points-calculated',{users: socketController.getUsersFromRoom(room_id)})
  })

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

    io.to(room_id).emit('game-data', socketController.getGameState(room_id));
  })

  socket.on('reset-user-state', (room_id) => {
    const currentUsers = socketController.getUsersFromRoom(room_id);
    const newUsers= currentUsers.map(user =>{
            user.answered = false;
        return user;
    })
    socketController.editUsers({room_id, users:newUsers})
    io.to(room_id).emit('user-state-reseted', {users: socketController.getUsersFromRoom(room_id)});
  })

  socket.on('handle-user-answer', (room_id) => {
    const currentUsers = socketController.getUsersFromRoom(room_id);
    const answers = {};
    console.log("CURRENT USERS ", currentUsers);
    currentUsers.map((user) => {
      answers[user.id] = user.answers;
    })

    socketController.saveUserAnswers(room_id, JSON.stringify(answers));
    io.to(room_id).emit('get-user-answer', {users: socketController.getUsersFromRoom(room_id)});
  })
  
});




const port = 5000;

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

require("./tables/video")(app);
require("./tables/rooms")(app);
require("./tables/users")(app);
require("./tables/rooms")(app);
require("./knex/buildDB")(app);
require("./cloudinary")(app);

httpServer.listen(port, () => console.log(`Listen on port ${port}`));