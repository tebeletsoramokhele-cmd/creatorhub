const contentRoutes = require("./routes/contentRoutes");
const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/content", contentRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Content Creator API is running!");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

