const client = require("./client");
const {
  addActivityToRoutine,
  createActivity,
} = require("./routine_activities");
const { attachActivitiesToRoutines } = require("./activities");

async function createRoutine({ creatorId, isPublic, name, goal, activities }) {
  console.log("Received activities:", activities);
  try {
    const {
      rows: [routine],
    } = await client.query(
      `
      INSERT INTO routines
      ("creatorId", "isPublic", name, goal)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [creatorId, isPublic, name, goal]
    );

    if (activities && activities.length > 0) {
      const activityList = activities.map((activity) =>
        createActivity({
          name: activity.name,
          description: activity.description,
        })
      );

      await Promise.all(
        activityList.map((activity) =>
          addActivityToRoutine({
            routineId: routine.id,
            activityId: activity.id,
            count: activity.count,
            duration: activity.duration,
          })
        )
      );
    }

    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRoutineById(id) {
  try {
    const {
      rows: [routine],
    } = await client.query(
      `
      SELECT DISTINCT routines.*,
      users.username AS "creatorName",
      routine_activities.count,
      routine_activities.duration,
      routine_activities."activityId",
      routine_activities."routineId"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      WHERE routines.id = $1;
      `,
      [id]
    );

    if (!routine) {
      throw {
        name: "RoutineNotFoundERROR",
        message: "Could not find a routine with that id.",
      };
    }

    const { rows: activities } = await client.query(
      `
      SELECT activities.*,
      routine_activities.count,
      routine_activities.duration,
      routine_activities."activityId",
      routine_activities."routineId"
      FROM activities
      JOIN routine_activities ON activities.id = routine_activities."activityId"
      WHERE routine_activities."routineId" = $1;
      `,
      [id]
    );

    routine.activities = activities.map((activity) => ({
      id: activity.activityId,
      routineId: activity.routineActivityId,
      ...activity,
    }));
    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRoutinesWithoutActivities() {
  try {
    const { rows: routines } = await client.query(
      `
      SELECT *
      FROM routines
      LEFT JOIN routine_activities ON routines.id = routine_activities."routineId"
      WHERE routine_activities."activityId" IS NULL;
      `
    );

    return routines;
  } catch (error) {
    console.error(error);
  }
}

async function getAllRoutines() {
  try {
    const { rows: routineIds } = await client.query(
      `
      SELECT DISTINCT routines.*,
      users.username AS "creatorName", 
      routine_activities.count,
      routine_activities.duration,
      routine_activities.id AS routineActivityId,
      routine_activities."routineId"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      JOIN activities ON routine_activities."activityId" = activities.id;
      `
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getAllPublicRoutines() {
  try {
    const { rows: routineIds } = await client.query(
      `
      SELECT DISTINCT routines.*,
      users.username AS "creatorName", 
      routine_activities.count,
      routine_activities.duration,
      routine_activities.id AS routineActivityId,
      routine_activities."routineId"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      JOIN activities ON routine_activities."activityId" = activities.id
      WHERE "isPublic" = true;
      `
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getAllRoutinesByUser({ username }) {
  try {
    const { rows: routineIds } = await client.query(
      `
      SELECT DISTINCT routines.*,
      users.username AS "creatorName", 
      routine_activities.count,
      routine_activities.duration,
      routine_activities.id AS routineActivityId,
      routine_activities."routineId"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      JOIN activities ON routine_activities."activityId" = activities.id
      WHERE users.username = $1;
      `,
      [username]
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getPublicRoutinesByUser({ username }) {
  try {
    const { rows: routineIds } = await client.query(
      `
      SELECT DISTINCT routines.*,
      users.username AS "creatorName", 
      routine_activities.count,
      routine_activities.duration,
      routine_activities.id AS routineActivityId,
      routine_activities."routineId"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      JOIN activities ON routine_activities."activityId" = activities.id
      WHERE "isPublic" = true AND users.username = $1;
      `,
      [username]
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getPublicRoutinesByActivity({ id }) {
  try {
    const { rows: routineIds } = await client.query(
      `
      SELECT DISTINCT routines.*,
      users.username AS "creatorName", 
      routine_activities.count,
      routine_activities.duration,
      routine_activities.id AS routineActivityId,
      routine_activities."routineId"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      JOIN activities ON routine_activities."activityId" = activities.id
      WHERE routines."isPublic" = true AND routine_activities."activityId" = $1;
      `,
      [id]
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateRoutine({ id, ...fields }) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  try {
    const {
      rows: [routine],
    } = await client.query(
      `
        UPDATE routines
        SET ${setString}
        WHERE id = ${id}
        RETURNING *;
        `,
      Object.values(fields)
    );

    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function destroyRoutine(id) {
  try {
    await client.query(
      `
      DELETE FROM routine_activities
      WHERE "routineId" = $1;
      `,
      [id]
    );

    const {
      rows: [routine],
    } = await client.query(
      `
      DELETE FROM routines
      WHERE id = $1
      RETURNING *;
      `,
      [id]
    );

    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  getRoutineById,
  getRoutinesWithoutActivities,
  getAllRoutines,
  getAllPublicRoutines,
  getAllRoutinesByUser,
  getPublicRoutinesByUser,
  getPublicRoutinesByActivity,
  createRoutine,
  updateRoutine,
  destroyRoutine,
};
