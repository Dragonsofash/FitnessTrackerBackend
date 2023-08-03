// Recquire files
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const apiRouter = require("./api");
const morgan = require("morgan");
const bodyParser = require("body-parser");

// Setup your Middleware and API Router here
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());

app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).send({
    message: "Request failed with status code 404",
  });
});

module.exports = app;
