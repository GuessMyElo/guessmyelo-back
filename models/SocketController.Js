const { getRandomVideos, saveUserAnswers } = require("../functions");

class SocketController {
    constructor() {
        this.games = {}
    }

    getUsersFromRoom(room_id) {
        if (!this.games[room_id]) this.games[room_id] = { users: [], config: {}, state: {} };
        return this.games[room_id].users;
    }

    removePlayerFromRoom(socket, room_id) {
        const userIndex = this.games[room_id] ? this.games[room_id].users.findIndex((u) => u.socket_id === socket.id) : -1;
        if (userIndex > -1) {
            this.games[room_id].users.splice(userIndex, 1);
            socket.leave(room_id);
        }
    }

    addPlayerToRoom(socket, {room_id, user}) {
        if (!this.games[room_id]) this.games[room_id] = { users: [], config: {}, state: {} };
        this.games[room_id].users.push({socket_id: socket.id, ...user});
    }

    editConfig({room_id,room_info}){
        this.games[room_id].config = room_info;
    }

    initState(room_id) {
        return new Promise((resolve) => {
            const config = this.getConfigFromRoom(room_id);
            getRandomVideos(config.nb_video)
                .then((videos) => {
                    this.games[room_id].state = {
                        alreadyAnswered : 0,
                        current_video : 0,
                        videos
                    }
                    resolve();
                })
        })
    }

    editState({room_id, state_info}){
        this.games[room_id].state = {...state_info};
    }

    editUsers({room_id,users}){
        this.games[room_id].users = users;
    }

    getStateFromRoom(room_id) {
        return this.games[room_id].state;
    }

    getConfigFromRoom(room_id){
        return this.games[room_id].config;
    }

    getGameState(room_id){
        const users= this.getUsersFromRoom(room_id);
        const roomInfo  = this.getConfigFromRoom(room_id);
        const state  = this.getStateFromRoom(room_id);
        return {users, roomInfo, state}
    }

    deleteRoom(room_id) {
        delete this.games[room_id];
    }

    async saveUserAnswers(room_id, answer) {
        await saveUserAnswers(room_id, answer);
    }
}

module.exports = new SocketController;