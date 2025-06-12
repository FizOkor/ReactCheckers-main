import 'dotenv/config';
import ViteExpress from "vite-express";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cookie from "cookie-session";
import compression from "compression";
import { Server } from "socket.io";
import { createServer } from 'http';
import bcrypt from 'bcrypt';
import ioHandler from './gameServer.js';

export const app = express();
export const server = createServer(app);
export const io = new Server(server);
ioHandler(io);
const saltRounds = 10;

app.use(compression());
app.use(express.json());
app.use(express.static("src/client/assets"));

// use express.urlencoded to get data sent by defaut form actions
// or GET requests
app.use(express.urlencoded({ extended: true }));


// Removed ALL MongoDB/bcrypt/session-related code
app.post("/login", (req, res) => {
  const { username } = req.body;
  console.log(username)
  
  if (!username || username.trim() === "") {
    return res.status(400).send("Username required");
  }

  //  accept the username, no persistence
  res.status(200).json({ 
    success: true,
    username: username.trim()
  });
});

// middleware to send unauthenicated users to the login page
export const requireAuth = (req, res, next) => {
  if (req.session.login) {
    next();
  } else {
    console.log("RequireAuth caught unauthorized user");
    res.status(401).send("Not authorized");
  }
};


app.post("/logout", (req, res) => {
  req.session = null;
  console.log("User logged out");
  res.status(401).send("Logged out");
});

// Simply responds with 200 if the client is authenticated
app.get("/checkAuth", (req, res) => {
  res.status(200).send();
})

export const gameStats = new Map(); // Format: { username: { wins: 0, losses: 0 } }
app.get("/data", (req, res) => {
  // Convert Map to sorted array
  const stats = Array.from(gameStats.entries()).map(([username, data]) => ({
    username,
    wins: data.wins || 0,
    losses: data.losses || 0,
    winrate: (data.wins || 0) / ((data.wins || 0) + (data.losses || 0)) || 0
  })).sort((a, b) => b.winrate - a.winrate);

  res.status(200).json({ stats });
});

server.listen(3000, () =>
  console.log("Server is listening on port 3000..."),
);

ViteExpress.bind(app, server);