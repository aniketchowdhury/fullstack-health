const express = require("express");
const cors = require("cors");
const redis = require("redis");

const router = express.Router();

const data = require("../models/data1");

let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

router.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
    // methods: ["GET", "POST"],
  })
);

router.get("/", async (req, res) => {
  try {
    const dataCopy = await data.find();
    console.log("***inside func '/'");
    res.send(dataCopy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
  // res.send("Hiii");
});

router.get("/:username", cache, async (req, res) => {
  console.log("****inside func");
  res.json(res.value);
  // try {
  //   value = await data.findOne({ username: req.params.username });
  //   if (value == null) {
  //     return res.status(404).json({ message: "wrong name" });
  //   }
  //   const { username, email } = value;
  //   // Set data to Redis
  //   console.log("****", username, email);
  //   redisClient.setex(username, 36000, email);
  //   res.send({ username, email });
  // } catch (err) {
  //   return res.status(500).json({ message: err.message });
  // }
});

router.post("/", async (req, res) => {
  const postData = new data({
    username: req.body.username,
    password: req.body.password,
    contact: req.body.contact,
    email: req.body.email,
  });
  try {
    const newData = await postData.save();
    console.log("***newData", newData);
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id", cachePatch, async (req, res) => {
  if (req.body.username != null) {
    res.value.username = req.body.username;
  }
  if (req.body.password != null) {
    res.value.password = req.body.password;
  }
  if (req.body.contact != null) {
    res.value.contact = req.body.contact;
  }
  try {
    console.log("*** RES.VALUE.SAVE", res.value);
    const updatedData = await res.value.save();
    res.status(201).json(updatedData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", getData, async (req, res) => {
  try {
    await res.value.remove();
    res.status(200).json({ message: "data deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getData(req, res, next) {
  let value;
  try {
    value = await data.findById(req.params.id);
    if (value == null) {
      return res.status(404).json({ message: "wrong id" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.value = value;
  next();
}

// Cache middleware
async function cache(req, res, next) {
  const { username } = req.params;
  let results;
  let isCached = false;
  console.log("****inside cache");
  try {
    const cacheResults = await redisClient.get(username);
    if (cacheResults) {
      isCached = true;
      results = JSON.parse(cacheResults);
      console.log("*****cached results=", results);
    } else {
      results = await data.findOne({ username: req.params.username });
      if (results == null) {
        return res.status(404).json({ message: "wrong name" });
      }
      console.log("****database results", results);
      await redisClient.set(username, JSON.stringify(results?.email));
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.value = { username: username, email: results?.email, isCached: isCached };
  next();
}

/***
 * cache for _id for patch & delete
 */
async function cachePatch(req, res, next) {
  const { id } = req.params;
  let results;
  let isCached = false;
  if (req.body.username != null) {
    res.value.username = req.body.username;
  }
  if (req.body.password != null) {
    res.value.password = req.body.password;
  }
  if (req.body.contact != null) {
    res.value.contact = req.body.contact;
  }
  console.log("****inside cache2");
  try {
    const cacheResults = await redisClient.get(id);
    if (cacheResults) {
      isCached = true;
      results = JSON.parse(cacheResults);
      console.log("*****cached2 results=", results);
    } else {
      results = await data.findById(req.params.id);
      if (results == null) {
        return res.status(404).json({ message: "wrong ID" });
      }
      console.log("****database results", results);
      await redisClient.set(id, JSON.stringify(results?.email));
      const updatedData = await res.value.save();
      return;
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.value = res;
  next();
}
module.exports = router;
