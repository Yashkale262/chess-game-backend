const express=require("express");
const app=express();
const http=require("http");
const cors=require("cors");  
const {Server} =require("socket.io");
const port=process.env.PORT;

app.get("/",(req,res)=>{
    res.send("App is working")
})
app.use(cors());

const server=http.createServer(app);
const io=new Server(server,{
    cors:{
       origin: "https://chess-game-yash.onrender.com/",
        methods: ["GET","POST"]
    }
});

let users={};               //Socket id : room number
let challengeUsers={};      //UUID: room number

let room=1;
let onlinePlyRoom=100;
let full=0;
let num=1;


io.on("connection",(socket)=>{
    
    socket.on("play-online",()=>{
        full++;
        if(full===1)
        {
            onlinePlyRoom=room;
            room++;
            users[socket.id]=onlinePlyRoom;
            socket.join("room"+onlinePlyRoom);
        }
        else if(full===2)
        {
            full=0;
            let game={
                player:0,
                room: onlinePlyRoom,
            }
            users[socket.id]=onlinePlyRoom;
            socket.join("room"+onlinePlyRoom);
            socket.in("room"+onlinePlyRoom).emit("game-details-p0",game);
        }
    });

    socket.on("game-details-p1-toserver",(game)=>{
        let cur_room=game.room;
        socket.in("room"+cur_room).emit("game-details-p1",game);
    })

    socket.on("challenge-friend",(joincode)=>{
        users[socket.id]=room;
        challengeUsers[joincode]=room;
        socket.join("room"+room);
        room++;
    });

    socket.on("join-game",(joincode)=>{
        if(challengeUsers[joincode])
        {
            let cur_room=challengeUsers[joincode];
            let game={
                player:0,
                room: cur_room,
            }
            users[socket.id]=cur_room;
            socket.join("room"+cur_room);;
            socket.in("room"+cur_room).emit("game-details-p0",game);
        }
        else{
        }
    });

    socket.on("send-move",(data)=>{
        let cur_room=users[socket.id];
        socket.in("room"+users[socket.id]).emit("receive-move",data);
    });

    socket.on("send-status",(data)=>{
        let cur_room=users[socket.id];
        socket.in("room"+users[socket.id]).emit("receive-status",data);
    });

    socket.on("disconnect",()=>{
        if(full===1&&users[socket.id]===onlinePlyRoom)
        {
            full=0;
        }
        socket.in("room"+users[socket.id]).emit("other-player-disconnected");

    })
})

server.listen(port,()=>{
    console.log("Server is running");
});


