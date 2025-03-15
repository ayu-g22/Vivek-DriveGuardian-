const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDb = require("./config/dbConnection");
// const erorHandler = require("./middlewares/errorHandler");
const dotenv = require("dotenv").config();
const vehicleRoutes = require("./routes/vehicle");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const port = 4000;

connectDb();
app.use(express.json());
app.use(cors());

const connectedUsers = {}; // Store connected users and their sockets

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  connectedUsers[userId] = socket.id; // Map userId to socket.id

  console.log(`User connected: ${userId}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    delete connectedUsers[userId]; // Remove disconnected user
  });

  // Listen for the transfer event
  socket.on("transfer", ({ recipientId, shiftedFrom, requestMessage }) => {
    const recipientSocketId = connectedUsers[recipientId]; // Get recipient socket id
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveRequest", {
        shiftedFrom,
        recipientId,
        requestMessage,
      });
    } else {
      console.log("Recipient not connected");
    }
  });

  // Listen for the response from the recipient
  socket.on("response", ({ recipientId, shiftedFrom, isAccepted }) => {
    const senderSocketId = connectedUsers[shiftedFrom]; // Get the socket id of the sender
    if (senderSocketId) {
      // Notify the sender of the recipient's response
      io.to(senderSocketId).emit("responseResult", { isAccepted, recipientId });
      console.log(
        `Response from ${recipientId} to ${shiftedFrom}: ${
          isAccepted ? "Accepted" : "Declined"
        }`
      );
    } else {
      console.log("Sender not connected");
    }
  });
});

// app.use(erorHandler);
app.use("/api", require("./routes/user-routes"));

app.use("/api/dashboard", require("./routes/dashboard-routes"));
app.use("/api", vehicleRoutes);
app.use("/api/transfer", require("./routes/tranfer-routes"));

server.listen(4001, () => {
  console.log("Socket's Server listening on port 4001");
});

app.listen(port, () => console.log(`Server started at Port ${port}`));
