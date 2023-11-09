const mongoose = require("mongoose");
const diet = new mongoose.Schema({
  email: {
    required: true,
    type: String,
  },
  foods: [
    {
      foodName: {
        type: String,
        required: true,
      },
    },
  ],
});
diet.methods.sayHi = function sayHi() {
  console.log(`value::${this?.foods}`);
};
module.exports = mongoose.model("UserDiet", diet);
