const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { requireAuthentication } = require("./utils");
const {
  getAllPublicRoutines,
  createRoutine,
  updateRoutine,
  getRoutineById,
  destroyRoutine,
  getRoutineActivitiesByRoutine,
  addActivityToRoutine,
} = require("../db");

// GET /api/routines
router.get("/", async (req, res, next) => {
  try {
    const routines = await getAllPublicRoutines();
    res.send(routines);
  } catch (error) {
    next(error);
  }
});

// POST /api/routines
router.post("/", requireAuthentication, async (req, res, next) => {
  const { isPublic, name, goal } = req.body;

  try {
    if (typeof req.headers.authorization !== "undefined") {
      const bearerHeader = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET);
      const newRoutine = await createRoutine({
        creatorId: decoded.id,
        isPublic,
        name,
        goal,
      });
      res.send(newRoutine);
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/routines/:routineId
router.patch("/:routineId", requireAuthentication, async (req, res, next) => {
  const { routineId } = req.params;
  const { isPublic, name, goal } = req.body;

  try {
    const bearerHeader = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET);

    const routine = await getRoutineById(routineId);

    if (routine.creatorId === decoded.id) {
      const updatedRoutine = await updateRoutine({
        id: routineId,
        isPublic: isPublic,
        name: name,
        goal: goal,
      });

      res.send(updatedRoutine);
    } else {
      res.status(403).send({
        error: "ERROR",
        message: `User ${decoded.username} is not allowed to update ${routine.name}`,
        name: "UNAUTHORIZED USER",
      });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/routines/:routineId
router.delete("/:routineId", async (req, res, next) => {
  const { routineId } = req.params;

  try {
    const bearerHeader = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET);

    const routine = await getRoutineById(routineId);

    if (routine.creatorId === decoded.id) {
      await destroyRoutine(routineId);

      res.send(routine);
    } else {
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

// POST /api/routines/:routineId/activities
router.post("/:routineId/activities", async (req, res, next) => {
  const { routineId, activityId, count, duration } = req.body;

  try {
    const routine_activities = await getRoutineActivitiesByRoutine({
      id: routineId,
    });
    const checkForExistingRoutineActivity = routine_activities.filter(
      (routine_activity) => {
        return (
          routine_activity.routineId === routineId &&
          routine_activity.activityId === activityId
        );
      }
    );

    if (checkForExistingRoutineActivity.length === 0) {
      const addRoutineActivity = await addActivityToRoutine({
        routineId,
        activityId,
        count,
        duration,
      });

      res.send(addRoutineActivity);
    } else {
      res.send({
        error: "ERROR",
        message: `Activity ID ${activityId} already exists in Routine ID ${routineId}`,
        name: "RoutineActivityAlreadyExists",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
