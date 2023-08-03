/* eslint-disable no-useless-catch */
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { requireAuthentication } = require("./utils.js");
const {
  getUserByUsername,
  createUser,
  getUser,
  getAllRoutinesByUser,
  getPublicRoutinesByUser,
} = require("../db");

// POST /api/users/register
router.post("/register", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const _user = await getUserByUsername(username);

    if (_user) {
      res.send({
        error: "ERROR",
        message: `User ${_user.username} is already taken.`,
        name: "UserExistsError",
      });
    } else if (password.length < 8) {
      res.send({
        error: "ERROR",
        message: "Password Too Short!",
        name: "PasswordTooShortError",
      });
    } else {
      const user = await createUser({ username, password });
      const token = jwt.sign(
        {
          id: user.id,
          username,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1w",
        }
      );

      res.send({
        message: "Thanks for signing up!",
        token: token,
        user: {
          id: user.id,
          username,
        },
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await getUser({ username, password });
    if (user) {
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
        },
        process.env.JWT_SECRET
      );

      res.send({
        user: {
          id: user.id,
          username: username,
        },
        message: "you're logged in!",
        token,
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/users/me
router.get("/me", requireAuthentication, async (req, res, next) => {
  try {
    const bearerHeader = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET);

    res.send({
      id: decoded.id,
      username: decoded.username,
    });
  } catch (error) {
    next();
  }
});

// GET /api/users/:username/routines
router.get("/:username/routines", async (req, res, next) => {
  const { username } = req.params;

  try {
    const bearerHeader = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET);

    if (decoded.username === username) {
      const routines = await getAllRoutinesByUser({ username });

      res.send(routines);
    } else {
      const routines = await getPublicRoutinesByUser({ username });

      res.send(routines);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
