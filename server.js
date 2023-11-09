const express = require("express");
const data = require("./data.json");
const app = express();
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { default: axios } = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const ws = require("ws");
mongoose.connect("mongodb://localhost:27017/database1", {
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connect to database"));
app.use(express.json());
const subscribersRouter = require("./routes/route");
const jwtRouter = require("./routes/testjwt");
const swaggerDocument = require("./swagger.json");
app.use("/data", subscribersRouter);
app.use("/jwt", jwtRouter);
// app.use(
//   cors({
//     origin: "http://localhost:3001",
//     credentials: true,
//     methods: ["GET", "POST"],
//   })
// );

// app.get("/data", function (req, res) {
//   let city = req.query?.city?.toLowerCase();
//   if (!city) {
//     return res.send({ status: "error", message: "Please enter a city name" });
//   } else if (city == data.city.toLowerCase()) {
//     return res.send(data);
//   }
//   //   res.send(data);
// });
(async () => {
  // code goes here
  const graphQLServer = new ApolloServer({
    typeDefs: `
      type User {
          id: ID!
          name: String!
          username: String!
          email: String!
          phone: String!
          website: String!,
          todo: Todo
      }

      type Todo {
          id: ID!
          title: String!
          completed: Boolean,
          userId: ID!,
          user: User
      }

      type Query {
          getTodos: [Todo]
          getAllUsers: [User]
          getUser(id: ID!): User
      }

  `,
    resolvers: {
      Todo: {
        user: async (todo) =>
          (
            await axios.get(
              `https://jsonplaceholder.typicode.com/users/${todo.id}`
            )
          ).data,
      },
      User: {
        todo: async (todo) =>
          (
            await axios.get(
              `https://jsonplaceholder.typicode.com/todos/${todo.id}`
            )
          ).data,
      },
      Query: {
        getTodos: async () =>
          (await axios.get(`https://jsonplaceholder.typicode.com/todos`)).data,
        getAllUsers: async () =>
          (await axios.get(`https://jsonplaceholder.typicode.com/users`)).data,
        getUser: async (parent, { id }) => USERS.find((e) => e.id === id),
      },
    },
  });
  await graphQLServer.start();
  app.use("/graphql", expressMiddleware(graphQLServer));
})();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.listen(3000, () => console.log("server started"));

const Pool = require("pg").Pool;
const { USERS } = require("./users");
const pool = new Pool({
  user: "me",
  host: "localhost",
  database: "details",
  password: "password",
  port: 5432,
});

const wsServer = new ws.WebSocketServer({ server: app });
wsServer.on("connection", (socket) => {
  socket.on("message", (message) => console.log(message));
});
// const server =
app.listen(8000, () => console.log("listening on websocket 8000"));
