const express = require("express");
const app = express();
const userRoute = require("./routes/userRoute");
const dbConnect = require("./config/dbconnect");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config()

dbConnect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: ["http://localhost:3000","http://reactlogin-02.netlify.app","https://reactlogin-02.netlify.app"], credentials: true }));
app.use(cookieParser());
app.use(express.static(path.resolve() + "/public"));

app.use("/", userRoute);


app.listen(4000, () => {
  console.log("Server running  on http://localhost:4000");
});
