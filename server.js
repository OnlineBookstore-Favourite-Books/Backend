
const express = require("express");


const cors = require("cors");
require("dotenv").config();
require("./config/db");

const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/cart", cartRoutes);
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.get("/", (req, res) => {
  res.send("Favourite Books API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});