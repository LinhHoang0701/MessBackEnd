const express = require("express");
const app = express();
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();
// importing routes
const routes = require("./routes");
const { NotFound } = require("./middlewares/errorHandlers");

// using middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(logger("dev"));

app.use(function (req, res, next) {
  //Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");
  //Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  //Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  //Set to true if you need the website to include cookies in the requests sent
  //to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  //Pass to next layer of middleware
  next();
});

// linking the routes
app.use("/api", routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = NotFound((req, res, next));
});

module.exports = app;
