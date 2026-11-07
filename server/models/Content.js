
const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ""
  },
  mediaUrl: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Draft", "Published", "Scheduled"],
    default: "Draft"
  },
  publicationDate: {
    type: Date
  },
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    name: String,
    message: String,
    status: {
      type: String,
      default: "Approved"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Content", contentSchema);
