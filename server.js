const express = require("express");
const data = require("./data.json");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/database1", {
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connect to database"));
app.use(express.json());
const subscribersRouter = require("./routes/route");
const jwtRouter = require("./routes/testjwt");
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
app.listen(3000, () => console.log("server started"));
