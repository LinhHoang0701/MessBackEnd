const routes = require("express").Router();
const userRoute = require("./api/UserRoute");
const chatRoute = require("./api/ChatRoute");
const messageRoute = require("./api/MessageRoute");

routes.use("/user", userRoute);
routes.use("/chat", chatRoute);
routes.use("/chat/message", messageRoute);

routes.get("/", (req, res) => {
  res.status(200).json({ message: "Connected!" });
});

module.exports = routes;
