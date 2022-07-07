const dotenv = require("dotenv").config();
const express = require("express");
const fileupload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http")
const socketController = require("./models/SocketController.Js");
const {saveUserAnswers, getUserAnswers} = require("./functions.js")

const app = express();

const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer, {
  pingInterval: 25000,
  pingTimeout: 90000,
  cors: {
    origin: process.env.ORIGIN,
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
    let answered = currentState.alreadyAnswered + 1;


    const newUsers= currentUsers.map(user =>{
        if(user.id === data.user_id){
            if (!user.answers) user.answers = [];
            user.answers[currentState.current_video] = {answer:data.answer, timestamp:new Date().getTime()};
            user.answered = true;
        }
        return user;
    })
    socketController.editState({room_id: data.room_id, state_info: {...currentState, alreadyAnswered:answered}});
    socketController.editUsers({room_id: data.room_id, users:newUsers})
    io.to(data.room_id).emit('answer-saved',{users: socketController.getUsersFromRoom(data.room_id), answer: data.answer})
  })

  socket.on('calcul-point',async (room_id) =>{
    const currentState = socketController.getStateFromRoom(room_id);
    let currentUsers = socketController.getUsersFromRoom(room_id);

    const userAnswers = JSON.parse(await getUserAnswers(room_id));
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
      
      const timestamps = Object.entries(userAnswers).filter(([, answers]) => answers[index] !== null ? answers[index].answer === rank : false).map(([userId, answersList]) => {
        return {userId, timestamp : answersList[index].timestamp};
      }).sort((a, b) => a.timestamp - b.timestamp);

      Object.entries(userAnswers).map(([userId, answers]) => {
        // Si la réponse de l'utilisateur est correcte
        if (answers[index] !== null && answers[index].answer === rank) {
          const timestampIndex = timestamps.findIndex((e) => {
            return e.userId === userId
          })
          const bonusPoints = currentUsers.length - timestampIndex;
          currentUsers = currentUsers.map(user => {
            if(user.id === parseInt(userId)) user.points += bonusPoints;
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

  socket.on('handle-user-answer', async (room_id) => {
    const currentUsers = socketController.getUsersFromRoom(room_id);
    const answers = {};
    currentUsers.map((user) => {
      answers[user.id] = user.answers;
    })

    await saveUserAnswers(room_id, JSON.stringify(answers));
    io.to(room_id).emit('get-user-answer', {users: socketController.getUsersFromRoom(room_id)});
  })
  
});




const port = process.env.PORT || 5000;

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

require("./tables/video")(app);
require("./tables/rooms")(app);
require("./tables/users")(app);
require("./tables/rooms")(app);
require("./knex/buildDB")(app);
require("./cloudinary")(app);

httpServer.listen(port, () => console.log(`Listen on port ${port}`));