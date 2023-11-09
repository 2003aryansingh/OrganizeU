import mongoose from "mongoose";
const Schema = mongoose.Schema;
// import connectDB from "../config/db.js";

// connectDB();

const boardSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
  ],
  cards: [
    {
      type: Schema.Types.ObjectId,
      ref: "cards",
    },
  ],
});

const boards = mongoose.model("boards", boardSchema);

export default boards;
