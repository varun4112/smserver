const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    // Add validation if needed
  },
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    max: 500,
    // Add validation if needed
  },
  file: {
    type: String,
    default: "",
    // Add validation if needed
  },
  community: {
    type: String,
    max: 500,
  },
  likes: {
    type: Array,
    default: [],
    // Add indexing if needed
  },
  comments:{
    type: Array,
    default: [],
  }
});

module.exports = mongoose.model("post", PostSchema);
