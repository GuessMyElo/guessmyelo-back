class SocketController {
    constructor() {
        //id room_id reponse

        this.games = {
            "456465465d4as654da65s4": {
                users: [
                    {
                        id: 1,
                        points: 15
                    }
                ],
                config: {
                    nb_videos: 10,
                    nb_loop: 2
                },
                state: {
                    loop: 1,
                    timestamp: 1541465465465,
                    alreadyAnswered: 0,
                    current_video: 0,
                    videos: [{link: link,rank:'challenger'}, {link:link,rank:'iron'}]
                }
            }
        }
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
        this.games[room_id] = {...this.games[room_id], state: {}}
    }

    editState({room_id, state_info}){
        this.games[room_id].state = state_info;
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