const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  canEditRoutineActivity,
  updateRoutineActivity,
  getRoutineActivityById,
  getRoutineById,
  destroyRoutineActivity,
} = require("../db");

// PATCH /api/routine_activities/:routineActivityId
router.patch("/:routineActivityId", async (req, res, next) => {
  if (!req.headers.authorization) {
    next();
  }

  const { routineActivityId } = req.params;
  const { count, duration } = req.body;

  try {
    const bearerHeader = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET);

    const verifyUser = await canEditRoutineActivity(
      routineActivityId,
      decoded.id
    );
    const routineActivity = await getRoutineActivityById(routineActivityId);
    if (verifyUser) {
      const updatedRoutineActivity = await updateRoutineActivity({
        id: routineActivity.id,
        count: count,
        duration: duration,
      });

      res.send(updatedRoutineActivity);
    } else {
      const routine = await getRoutineById(routineActivity.routineId);
      res.send({
        error: "ERROR",
        message: `User ${decoded.username} is not allowed to update ${routine.name}`,
        name: "UNAUTHORIZED USER",
      });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/routine_activities/:routineActivityId
router.delete("/:routineActivityId", async (req, res, next) => {
  if (!req.headers.authorization) {
    next();
  }

  const { routineActivityId } = req.params;

  try {
    const bearerHeader = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET);

    const verifyUser = await canEditRoutineActivity(
      routineActivityId,
      decoded.id
    );
    const routineActivityToDelete = await getRoutineActivityById(
      routineActivityId
    );

    if (verifyUser) {
      const deletedRoutineActivity = await destroyRoutineActivity(
        routineActivityId
      );

      res.send(deletedRoutineActivity);
    } else {
      const routine = await getRoutineById(routineActivityToDelete.routineId);
      res.status(403).send({
        error: "ERROR",
        message: `User ${decoded.username} is not allowed to delete ${routine.name}`,
        name: "UNAUTHORIZED USER",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
