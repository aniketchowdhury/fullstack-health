const mongoose = require("mongoose");

const userdetails = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    contentType: String,
  },
});
module.exports = mongoose.model("UserDetails1", userdetails);
