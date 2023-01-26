const mongoose = require("mongoose");

const usertable = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  weight: {
    type: String,
    required: true,
  },
  height: { type: String, required: true },
  calorie_intake: [
    {
      calorie_value: { type: Number, required: true },
      intake_date: { type: String, required: true },
    },
  ],
});
module.exports = mongoose.model("UserTable", usertable);
