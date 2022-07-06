class SocketController {
    constructor() {
        //id room_id reponse

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
        this.games[room_id] = {...this.games[room_id], state: {
            alreadyAnswered : 0,
            current_video : 0,
            videos : [
                {
                    "id": 7,
                    "rank": "diamond",
                    "url": "https://res.cloudinary.com/guessmyelo/video/upload/v1653654909/videos/lol/q6oc4swd941qyweg2b84.mp4",
                    "userId": 2,
                    "public_id": "videos/lol/fcrwoqysqiymowvzosco",
                    "status": "verified",
                    "game": "lol"
                },
                {
                    "id": 6,
                    "rank": "bronze",
                    "url": "https://res.cloudinary.com/guessmyelo/video/upload/v1653405124/videos/lol/eqmffb5gxzc3rbdm0kvq.mp4",
                    "userId": 2,
                    "public_id": "videos/lol/eqmffb5gxzc3rbdm0kvq",
                    "status": "verified",
                    "game": "lol"
                },
                {
                    "id": 8,
                    "rank": "master",
                    "url": "https://res.cloudinary.com/guessmyelo/video/upload/v1653654909/videos/lol/q6oc4swd941qyweg2b84.mp4",
                    "userId": 1,
                    "public_id": "videos/lol/q6oc4swd941qyweg2b84",
                    "status": "verified",
                    "game": "lol"
                }
            ]
        }}
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
}

module.exports = new SocketController;