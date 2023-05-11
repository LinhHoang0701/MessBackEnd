const app = require("./app");
const connectDb = require("./config/database");
require("dotenv").config();

const port = process.env.PORT || 5000;

connectDb();

// since we are useing socket.io in this project , we need to store the below line into a variable as server which will be used by socket.io
const server = app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

// -----------------------------DEPLOYMENT--------------------------------------------------------

if (process.env.NODE_ENV === "production") {
  app.get("/", (req, res) => {
    res.send("Trell api is running successfully");
  });
}

// ---------------------------------------- DEPLOYMENT ---------------------------------

// require the socket library and store it into io vairable , and it is a function that takes an argument server which we have defined above and a cb

const io = require("socket.io")(server, {
  // this object is our socket config , here we can define a few things
  // pingtimeout is how much time will the socket server will wait before clsoging the connection, its in miliseconds
  pingTimeout: 70000,
  cors: {
    // origin of the frontend or the deployed application
    origin: "http://localhost:3000",
  },
});

// we will run on method from the io that we will use to create a connecton, it takes two arguments a string to define what type of event we want to do and a cb, inside cb we have access to socket args

io.on("connection", (socket) => {
  // whenever someone from front will connect to this socket , it will give info about that inside of socket variable
  // from here we can make connections by using on function of socket that takes a string arg  of the name of what we want to do with that socket and a cb

  // first socket defining the setup of a user joining  with their user_id
  socket.on("usersetup", (id) => {
    // use join method for a user to join with their id that we get from the frontend
    socket.join(id);
    socket.emit("connected");
  });

  // second socket for a user to join the chat room with the chatId
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    // emit user joined the chat
    io.to(chatId).emit("user joined");
  });

  // create socket for typing and stop typing
  socket.on("typing", (chatId) => {
    socket.in(chatId).emit("typing on", chatId);
  });

  socket.on("stop typing", (chatId) => socket.to(chatId).emit("typing done"));

  // third socket to send a message and recieve a message
  socket.on("send message", (message) => {
    // first find out the chat to which this message belongs to
    let chat = message?.chat;
    // if that chat dont have any users then return
    if (!chat?.users) return console.log("chat.users is not defined");
    // run a loop on the users of chat and see if the message is sendt by the loggedin user in that that then dont emit to that user
    chat?.users?.forEach((user) => {
      if (user?._id == message?.sender?._id) return;
      // emit to users in the chat except from the user who wo sent the message, in method to target the particular user of the chat
      socket.to(user?._id).emit("recieve message", message);
      socket.to(user?._id).emit("recieve notification", message);
    });
  });

  // off socket
  socket.off("usersetup", () => {
    console.log("user disconnected");
    socket.leave(user?._id);
  });
});
