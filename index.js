const express = require("express");
const { default: helmet } = require("helmet");
const { default: mongoose } = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute = require("./routes/coversation");
const messageRoute=require("./routes/message")
require("dotenv").config();
app.use("/uploads", express.static("./uploads"));

const PORT = 4000 || process.env.PORT;

// MongoBD Connection Using Mongoose
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("MongoDB Connected Sucessfully to smServer");
  })
  .catch((err) => {
    console.log(`mongoDB connection failed! Error: ${err}`);
  });
// end of mongoDB connection

// Middleware Start
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors());

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/message",messageRoute)

app.listen(PORT, () => {
  console.log(`backend server is running in port:${PORT}`);
});

app.get("/", (req, res) => {
  // Send a response with an HTML message indicating that the server is running
  res.send("<h1>Social Media Server Running :D</h1>");
});
app.get("/uploads", async (req, res) => {
  try {
    const directoryPath = path.join(__dirname, "uploads"); // Path to the 'uploads' directory
    const files = await fs.readdir(directoryPath);
    res.send(files.join("<br/>")); // Sending file names as HTML for displaying in the browser
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
