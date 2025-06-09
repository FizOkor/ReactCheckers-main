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

const uri = `mongodb+srv://${process.env.MONGOUSER}:${process.env.PASS}@${process.env.HOST}`; //change back to server for push
console.log(uri);
const client = new MongoClient(uri);

// cookie middleware
app.use(
  cookie({
    name: "session",
    keys: ["NMGwPsSJoXMuG3PMMlLaRovinvxfg9k5", "eZUaeH4PboBbTzGpAHTmrCIXV6tZRHHz"], // hardcoded :P
  })
);

try {
  await client.connect();
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("Connection error", err);
}

app.post("/register", async (req, res) => {
  console.log("Got registration request");
  const { username, password } = req.body;

  async function registerUser() {
    try {
      const authnDB = client.db("checkers").collection("users");
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const existingUser = await authnDB.findOne({ username: username });

      if (existingUser) {
        res.status(400).send("Username is already taken");
        return;
      }

      const result = await authnDB.insertOne({
        username: username,
        password: hashedPassword,
      });
      req.session.login = true;
      req.session.userId = username;
      res.status(201).send("User registered successfully.");
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).send("Registration error.");
    }
  }

  registerUser();
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login request for user", username, "with password", password);
  async function authenticate() {
    try {
      const authnDB = client.db("checkers").collection("users");
      const user = await authnDB.findOne({ username: username });
      if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          req.session.login = true;
          req.session.userId = username;
          res.status(201).send(); // correct credentials
        } else {
          console.log("Incorrect credentials");
          res.status(401).send("Incorrect credentials"); // incorrect credentials
        }
      } else {
        console.log("Incorrect credentials"); // we shan't be overly informative with error messages for security reasons
        res.status(401).send("Incorrect credentials"); // user not found
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  }

  authenticate();
});

// middleware that always sends unauthenicated users to the login page
export const requireAuth = (req, res, next) => {
  if (req.session.login) {
    next();
  } else {
    console.log("RequireAuth caught unauthorized user");
    res.status(401).send("Not authorized");
  }
};


app.post("/logout", requireAuth, (req, res) => {
  req.session = null;
  console.log("User logged out");
  res.status(401).send("Logged out");
});

// Simply responds with 200 if the client is authenticated
app.get("/checkAuth", requireAuth, (req, res) => {
  res.status(200).send();
})

export const statsDB = client.db("checkers").collection("stats");
app.get("/data", requireAuth, async (req, res) => {
  res.status(200).json({
    stats: (await statsDB.find().toArray()).sort((a, b) => {
      a.winrate = a.wins / (a.wins + a.losses);
      b.winrate = b.wins / (b.wins + b.losses);
      return b.winrate - a.winrate;
    }), username: req.session.userId
  });
})

server.listen(3000, () =>
  console.log("Server is listening on port 3000..."),
);

ViteExpress.bind(app, server);