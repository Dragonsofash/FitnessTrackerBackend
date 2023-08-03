const express = require("express");
const router = express.Router();
const {
  getAllActivities,
  getActivityByName,
  createActivity,
  getActivityById,
  updateActivity,
  getPublicRoutinesByActivity,
} = require("../db");

// GET /api/activities/:activityId/routines
router.get("/:activityId/routines", async (req, res, next) => {
  const { activityId } = req.params;
  try {
    const activity = await getActivityById(activityId);

    if (activity) {
      const routines = await getPublicRoutinesByActivity({ id: activityId });

      res.send(routines);
    } else {
      res.send({
        error: "ERROR",
        message: `Activity ${activityId} not found`,
        name: "ActivityNotFound",
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/activities
router.get("/", async (req, res, next) => {
  try {
    const activities = await getAllActivities();

    res.send(activities);
  } catch (error) {
    next(error);
  }
});

// POST /api/activities
router.post("/", async (req, res, next) => {
  if (!req.headers.authorization) {
    next();
  }

  const { name, description } = req.body;

  try {
    const checkForActivity = await getActivityByName(name);

    if (!checkForActivity) {
      const newActivity = await createActivity({ name, description });

      res.send(newActivity);
    } else {
      res.send({
        error: "ERROR",
        message: `An activity with name ${name} already exists`,
        name: "activity already exists",
      });
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/activities/:activityId
router.patch("/:activityId", async (req, res, next) => {
  if (!req.headers.authorization) {
    next();
  }

  const { activityId } = req.params;
  const { name, description } = req.body;

  try {
    const activity = await getActivityById(activityId);
    const activityByName = await getActivityByName(name);

    if (!activity) {
      res.send({
        error: "ERROR",
        message: `Activity ${activityId} not found`,
        name: "ActivityNotFound",
      });
    } else if (activityByName && activityByName.name === name) {
      res.send({
        error: "ERROR",
        message: `An activity with name ${name} already exists`,
        name: "ActivityAlreadyExists",
      });
    } else {
      const updatedActivity = await updateActivity({
        id: activityId,
        name: name,
        description: description,
      });
      res.send(updatedActivity);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
