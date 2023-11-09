const mongoose = require("mongoose");

const pedagogy = new mongoose.Schema({
  email: {
    type: "string",
    required: true,
  },
  pedagogyPreferences: [
    {
      day: { type: "string", required: true },
      activities: [
        {
          pref1: { type: "string", required: true },
          pref2: { type: "string", required: true },
        },
      ],
    },
  ],
});
const calendar = new mongoose.Schema({
  email: {
    type: "string",
    required: true,
  },
  calendarDetails: [
    {
      topic: { type: "string", required: true },
      duration: { type: "string", required: true },
    },
  ],
  theme: {
    type: "string",
  },
});
const birthdayList = new mongoose.Schema({
  email: {
    type: "string",
    required: true,
  },
  birthdayList: [
    {
      name: {
        type: "string",
        required: true,
      },
      age: { type: "number", required: true },
      date: {
        type: "string",
        required: true,
      },
    },
  ],
});
