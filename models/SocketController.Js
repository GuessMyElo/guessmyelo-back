class SocketController {
    constructor() {
        this.users = {};
    }

    getUsersFromRoom(room_id) {
        return this.users[room_id];
    }

    removePlayerFromRoom(socket, room_id) {
        console.log(this.users);
        const userIndex = this.users[room_id] ? this.users[room_id].findIndex((u) => u.socket_id === socket.id) : -1;
        if (userIndex > -1) {
            this.users[room_id].splice(userIndex, 1);
            socket.leave(room_id);
        }
    }

    addPlayerToRoom(socket, {room_id, user}) {
        console.log(room_id);
        if (!this.users[room_id]) this.users[room_id] = [];
        this.users[room_id].push({socket_id: socket.id, ...user});
        socket.join(room_id);
    }
}

module.exports = new SocketController;