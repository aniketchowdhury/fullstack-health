const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const redis = require("redis");
require("dotenv").config();
const data = require("../models/data1");
const table = require("../models/usertable");

let refreshTokens = [];

router.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:19006"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

router.get("/details", authenticateToken, async (req, res) => {
  try {
    console.log("***req.query", req.query);
    const existingUser = await table.findOne(
      { email: req.user.email },
      { calorie_intake: { $slice: [0, 10] } } // $slice: [offset, limit] => will return 'limit' items after 'offset' number of items
    );
    if (existingUser) {
      if (req.query && Object.keys(req.query).length > 0) {
        const {
          intake_date,
          sort,
          calorie_value,
          offset = 0,
          limit = 10,
        } = req.query;
        let findResult = null;
        let queriedResult = null;
        // let xxx = "calorie_value";
        if (intake_date)
          queriedResult = await table.findOne(
            {
              "calorie_intake.intake_date": intake_date, // for search query
            },
            { "calorie_intake.$": 1 }
          );
        if (calorie_value) {
          // findResult = await table
          //   .find()
          //   .where({ email: req.user.email })
          //   .where("calorie_intake.calorie_value")
          //   .equals(calorie_value);
          // .slice([offset, limit]); // find a specific property value pair from object.

          queriedResult = await table.find(
            { email: req.user.email },
            {
              calorie_intake: {
                $elemMatch: { calorie_value: calorie_value }, // find a particular item from array; { $gte: calorie_value } for finding greater than values
              },
            }
          );
          // queriedResult = await table.aggregate([
          //   { $match: { email: req.user.email } },
          //   { $unwind: "$calorie_intake" },
          //   { $match: { "calorie_intake.calorie_value": calorie_value } },
          // ]);
          // .slice([offset, limit]);
        }
        if (req.query.offset && req.query.limit) {
          queriedResult = await table.find(
            { email: req.user.email },
            { calorie_intake: { $slice: [Number(offset), Number(limit)] } } // $slice: [offset, limit] => will return 'limit' items after 'offset' number of items
          );
        }
        if (queriedResult) res.status(200).json(queriedResult);
        else res.status(404).json({ message: "Not Found" });
      } else res.status(200).json(existingUser);
    } else res.status(400).json({ message: "Not Found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/details", authenticateToken, async (req, res) => {
  try {
    const existingUser = await table.findOne({ email: req.user.email });
    if (existingUser) {
      const calorieDetails = {
        calorie_value: req.body.calorie_value,
        intake_date: req.body.intake_date,
      };
      console.log("^^^^email:", req.user.email, calorieDetails);
      const updatedTable = await table.findOneAndUpdate(
        { email: req.user.email },
        { $push: { calorie_intake: calorieDetails } },
        { upsert: true }
      );
      console.log("*****updatedTable", updatedTable);
      res.status(200).json(updatedTable);
    } else {
      const postData = new table({
        email: req.user.email.toLowerCase(),
        weight: req.body.weight,
        height: req.body.height,
        // calorie_intake: req.body.calorie_intake,
        calorie_intake: [
          {
            calorie_value: req.body.calorie_value,
            intake_date: req.body.intake_date,
          },
        ],
      });
      const saveData = await postData.save();
      res.status(200).json(saveData);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/details", authenticateToken, async (req, res) => {
  // update a calorie intake for the day
  try {
    const existingUser = await table.findOne({ email: req.user.email });
    if (existingUser) {
      const calorieDetails = {
        calorie_value: req.body.calorie_value,
        intake_date: req.body.intake_date,
      };
      const newDetails = {
        calorie_value: req.body.new_calorie_value,
        intake_date: req.body.new_intake_date,
      };
      const updatedData = await table.findOneAndUpdate(
        // { calorie_intake: { $elemMatch: calorieDetails } },
        // { $set: { calorie_intake: newDetails } }
        { "calorie_intake.intake_date": req.body.intake_date },
        { $set: { "calorie_intake.$.calorie_value": req.body.calorie_value } }
      );
      // console.log(req.user.email, existingUser);
      res.status(200).json(updatedData);
    } else res.status(404).json(updatedData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/details", authenticateToken, async (req, res) => {
  // delete a calorie intake for a day
  try {
    const existingUser = await table.findOne({ email: req.user.email });
    if (existingUser) {
      const calorieDetails = {
        calorie_value: req.body.calorie_value,
        intake_date: req.body.intake_date,
      };
      const deletedData = await table.findOneAndUpdate(
        { calorie_intake: { $elemMatch: calorieDetails } },
        { $pull: { calorie_intake: calorieDetails } }
      );
      console.log(deletedData);
      res.status(200).json(deletedData);
    } else res.status(404).json(deletedData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/", authenticateToken, async (req, res) => {
  try {
    const dbData = await data.findOne({
      email: req.user.email.toLowerCase(),
    });
    if (dbData == null) {
      return res.status(404).json({ message: "wrong id" });
    }
    res.status(201).json(dbData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    // console.log(`welcome to jwt page ${req.user.name}`);
  }
});

router.post("/signup", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const contact = req.body?.contactnum;
  const encryptedPassword = await bcrypt.hash(password, 10);
  const user = {
    username: username,
    email: email.toLowerCase(),
    password: encryptedPassword,
    contact: contact ?? null,
  };
  const oldUser = await data.findOne({ email: email.toLowerCase() });

  if (oldUser) {
    return res.status(401).send("User Already Exist. Please Login");
  }

  const postData = new data(user);
  try {
    console.log(postData);
    const newData = await postData.save();
    console.log("***newData: ", JSON.stringify(newData));
    res.sendStatus(201);
    // res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("***email: ", email, "::::password: ", password);
  const existingUser = await data.findOne({ email: email.toLowerCase() });
  const checkPassword = await bcrypt.compare(password, existingUser.password);
  // await bcrypt.compare(password, existingUser.password);
  if (existingUser && checkPassword) {
    console.log(
      "****check",
      existingUser.password,
      checkPassword,
      existingUser
    );
    // access & refresh token
    try {
      const accessToken = generateAccessToken({
        email: existingUser.email,
        password,
      });
      const refreshToken = jwt.sign(
        { email: existingUser.email },
        process.env.REFRESH_TOKEN_KEY
      );
      console.log("****refresh token", refreshToken);
      refreshTokens.push(refreshToken);
      // res.json({ message: "done!!!" });
      return res
        .cookie("jwt", refreshToken, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 24 * 60,
          // expires: new Date(Date.now() + 60000),
        })
        .status(201)
        .json({ accessToken: accessToken, refreshToken: refreshToken });
      // res.sendStatus(201);
      // res.json({ accessToken: accessToken, refreshToken: refreshToken });
    } catch (err) {
      // res.sendStatus(400).json({ message: err });
      console.log("****error", err);
    }
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
});

router.get("/logout", authenticateToken, async (req, res) => {
  // res.cookie("jwt", "", { expires: new Date(Date.now()) });
  return res
    .cookie("jwt", "", { maxAge: 1 })
    .status(200)
    .json({ message: "logged out" });
  // const authHeader = req.headers["authorization"];
  // jwt.sign(authHeader, "", { expiresIn: 1 }, (logout, err) => {
  //   if (logout) {
  //     res.send({ msg: "You have been Logged Out" });
  //   } else {
  //     res.send({ msg: "Error" });
  //   }
  // });
});

function parseCookies(request) {
  const list = {};
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(`;`).forEach(function (cookie) {
    let [name, ...rest] = cookie.split(`=`);
    name = name?.trim();
    if (!name) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[name] = value; // decodeURIComponent(value);
  });

  return list;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];
  token = parseCookies(req)?.jwt;
  console.log("***token: ", token);
  if (!token) return res.sendStatus(401);
  // if (!refreshTokens.includes(token)) {
  //   console.log("####includes check");
  //   return res.sendStatus(403);
  // }
  jwt.verify(token, process.env.REFRESH_TOKEN_KEY, async (err, user) => {
    if (err) {
      console.log("$$$$$error:-", err);
      return res.cookie("jwt", "", { maxAge: 1 }).sendStatus(403);
    }
    req.user = user;
    // const accessToken = generateAccessToken({ name: user.name });
    // res.json({ accessToken: accessToken });
    next();
  });
}
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: "16s" });
}
module.exports = router;
