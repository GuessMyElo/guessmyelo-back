class SocketController {
    constructor() {
        this.games = {}
    }

    getUsersFromRoom(room_id) {
        if (!this.games[room_id]) this.games[room_id] = { users: [], config: {} };
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
        if (!this.games[room_id]) this.games[room_id] = { users: [], config: {} };
        this.games[room_id].users.push({socket_id: socket.id, ...user});
        socket.join(room_id);
    }

    editConfig({room_id,room_info}){
        if (!this.games[room_id]) this.games[room_id] = { users: [], config: {} };
        this.games[room_id].config = room_info;
    }

    getConfigFromRoom(room_id){
        if (!this.games[room_id]) this.games[room_id] = { users: [], config: {} };
        return this.games[room_id].config;
    }

    getGameState(room_id){
        const users= this.getUsersFromRoom(room_id);
        const roomInfo  = this.getConfigFromRoom(room_id);
        return {users, roomInfo}
    }
}

module.exports = new SocketController;