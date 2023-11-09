const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const redis = require("redis");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs");
require("dotenv").config();
const data = require("../models/data1");
const table = require("../models/usertable");
const diet = require("../models/diet");
const db = require("../queries/queries");

let refreshTokens = [];

let redisClient;

(async () => {
  redisClient = redis.createClient(6379);

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

router.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:19006"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);
router.use(fileUpload());

router.get("/diet", authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const existingUser = await diet.findOne({ email: email });
    if (existingUser) {
      existingUser.sayHi();
      res.status(200).json(existingUser?.foods);
    } else res.status(400).json({ message: "Doesn't exist" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/sql", db.getUsers);

router.post("/sql1", async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  db.pool.query(
    "INSERT INTO users (name,email) VALUES ($1, $2)",
    [name, email],
    (error, results) => {
      if (error) {
        throw error;
      }
      console.log(results.rows);
      res.status(200).json(results.rows);
    }
  );
});

router.patch("/sql1", async (req, res) => {
  const contact = req.body.contact;
  const email = req.body.email;
  db.pool.query(
    "UPDATE users SET contact = $1 where email = $2 returning *",
    [contact, email],
    (error, results) => {
      if (error) {
        throw error;
      }
      console.log(results.rows);
      res.status(200).json(results.rows);
    }
  );
});

router.get("/sql2", async (req, res) => {
  db.pool.query(
    `SELECT * FROM users WHERE name=$1`,
    [req.query.name.toUpperCase()],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
});

router.post("/diet", authenticateToken, async (req, res) => {
  try {
    const existingUser = await diet.findOne({ email: req.user.email });
    if (existingUser) {
      const updatedDiet = await diet.findOneAndUpdate(
        { email: req.user.email },
        { $push: { foods: { foodName: req.body.foodName } } },
        { upsert: true }
      );
      if (updatedDiet) res.status(200).json(updatedDiet);
    } else {
      const postDiet = new diet({
        email: req.user.email,
        foods: [{ foodName: req.body.foodName }],
      });
      const savedDiet = await postDiet.save();
      res.status(200).json(savedDiet);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/download", authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const existingUser = await data.findOne({ email: email });
    if (existingUser?.image) {
      const options = {
        root: `${__dirname}/uploads/`,
        dotfiles: "deny",
        headers: {
          "x-timestamp": Date.now(),
          "x-sent": true,
        },
      };
      res.sendFile(existingUser.image, options);
    } else res.status(400).json({ message: "Image doesn't exist" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/upload", authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const existingUser = await data.findOne({ email: email });
    if (existingUser) {
      console.log("****yay", req.user);
      const myFile = req.files.file;
      console.log("***file:", myFile);
      //  mv() method places the file inside public directory
      myFile.mv(`${__dirname}/uploads/${myFile.name}`, async function (err) {
        if (err) {
          console.log(err);
          return res.status(500).send({ msg: "Error occured" });
        }
        existingUser.image = myFile.name;
        const updatedData = await existingUser.save();
        // returing the response with file path and name
        res.status(200).json(updatedData);
        // return res.send({ name: myFile.name, path: `/${myFile.name}` });
      });
      // res.status(200).json(updatedData);
    } else res.status(400).json({ message: "Not Found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/details", [authenticateToken, cache], async (req, res) => {
  let resCopy;
  try {
    console.log("***req.query", res.value);
    // const existingUser = await table.findOne(
    //   { email: req.user.email },
    //   { calorie_intake: { $slice: [0, 10] } } // $slice: [offset, limit] => will return 'limit' items after 'offset' number of items
    // );
    // post redis integration
    const existingUser = res.value;
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
        if (intake_date) {
          queriedResult = existingUser?.calorie_intake;
          queriedResult = queriedResult.filter(
            (item) => item.intake_date == intake_date
          );
        }
        // queriedResult = await table.findOne(
        //   {
        //     "calorie_intake.intake_date": intake_date, // for search query
        //   },
        //   { "calorie_intake.$": 1 }
        // );
        if (calorie_value) {
          queriedResult = existingUser?.calorie_intake;
          queriedResult = queriedResult.filter(
            (item) => item.calorie_value == calorie_value
          );
          // findResult = await table
          //   .find()
          //   .where({ email: req.user.email })
          //   .where("calorie_intake.calorie_value")
          //   .equals(calorie_value);
          // .slice([offset, limit]); // find a specific property value pair from object.

          // queriedResult = await table.find(
          //   { email: req.user.email },
          //   {
          //     calorie_intake: {
          //       $elemMatch: { calorie_value: calorie_value }, // find a particular item from array; { $gte: calorie_value } for finding greater than values
          //     },
          //   }
          // );
          // const result = queriedResult[0]?.calorie_intake?.length;
          // queriedResult[0].numFound = result;
          // resCopy = JSON.parse(JSON.stringify(queriedResult));
          // resCopy[0].numFound = result;
          // queriedResult = await table.aggregate([
          //   { $match: { email: req.user.email } },
          //   { $unwind: "$calorie_intake" },
          //   { $match: { "calorie_intake.calorie_value": calorie_value } },
          // ]);
          // .slice([offset, limit]);
        }
        if (req.query.offset && req.query.limit) {
          queriedResult = existingUser?.calorie_intake;
          queriedResult = queriedResult.slice(
            Number(offset),
            Number(limit) + Number(offset)
          );
          console.log(
            "%%%%queriedResult",
            typeof req.query.offset,
            typeof req.query.limit,
            queriedResult.length
          );
          // queriedResult = await table.find(
          //   { email: req.user.email },
          //   { calorie_intake: { $slice: [Number(offset), Number(limit)] } } // $slice: [offset, limit] => will return 'limit' items after 'offset' number of items
          // );
        }
        if (queriedResult) {
          console.log("###gotcha", queriedResult);
          res.status(200).json(queriedResult);
        } else res.status(404).json({ message: "Not Found" });
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

router.get("/", [authenticateToken, cache], async (req, res) => {
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
    image: null,
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
    res.status(200).json({ message: newData });
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
  const checkPassword = await bcrypt.compare(
    password,
    existingUser?.password ?? ""
  );
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

async function cache(req, res, next) {
  const { email, image } = req.user;
  let results;
  let isCached = false;
  console.log("****inside cache", email, image);
  try {
    const cacheResults = await redisClient.get(email);
    if (cacheResults) {
      isCached = true;
      results = JSON.parse(cacheResults);
      console.log("*****cached results=", results);
    } else {
      results = await table.findOne(
        { email: req.user.email },
        { calorie_intake: { $slice: [0, 10] } }
      );
      if (results == null) {
        return res.status(404).json({ message: "wrong name" });
      }
      console.log("****database results", results);
      await redisClient.set(email, JSON.stringify(results?.calorie_intake));
      const tt = await redisClient.get(email);
      console.log("***REDIS", tt);
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.value = {
    calorie_intake: results,
    email: email,
    // isCached: isCached,
  };
  next();
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];
  token = parseCookies(req)?.jwt;
  console.log("***token: ", token);
  console.log("***req, res", req.body);
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
    console.log("***user", user);
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
