const express = require("express");
const router = express.Router();
const Content = require("../models/Content");
const protect = require("../middleware/authMiddleware");

// PUBLIC: Display all published and other content
router.get("/", async (req, res) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 });
    res.status(200).json(contents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUBLIC: Like content
router.post("/:id/like", async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUBLIC: Record a view
router.post("/:id/view", async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUBLIC: Add a viewer comment
router.post("/:id/comments", async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        message: "Name and comment are required."
      });
    }

    const content = await Content.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            name: name.trim(),
            message: message.trim(),
            status: "Approved"
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(201).json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PROTECTED: Add new content
router.post("/", protect, async (req, res) => {
  try {
    const newContent = new Content(req.body);
    const savedContent = await newContent.save();

    res.status(201).json(savedContent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PROTECTED: Update content
router.put("/:id", protect, async (req, res) => {
  try {
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedContent) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json(updatedContent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PROTECTED: Delete content
router.delete("/:id", protect, async (req, res) => {
  try {
    const deletedContent = await Content.findByIdAndDelete(req.params.id);

    if (!deletedContent) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json({
      message: "Content deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;