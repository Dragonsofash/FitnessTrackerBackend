const client = require("./client");
// const {
//   addActivityToRoutine,
//   createActivity,
// } = require("./routine_activities");
// const { attachActivitiesToRoutines } = require("./activities");

async function createRoutine({ creatorId, isPublic, name, goal }) {
  // Create and return a new routine
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

    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRoutineById(id) {
  // Fetch routines by their id
  try {
    const {
      rows: [routine],
    } = await client.query(
      `
      SELECT *
      FROM routines
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

    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRoutinesWithoutActivities() {
  // Fetch any routines that do not have any activities
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
  // Fetch all routines
  // Attach activities, including routineId and routineActivityId
  // JOIN username from users, aliased AS creatorName
  // JOIN duration and count from routine_activities
  try {
    const { rows: routines } = await client.query(
      `
      SELECT *
      FROM routines;
      `
    );

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getAllPublicRoutines() {
  // Fetch all routines where "isPublic" = true
  // Attach activities, including routineId and routineActivityId
  // JOIN username from users, aliased AS creatorName
  // JOIN duration and count from routine_activities
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
  // Fetch all routines by username
  // Attach activities, including routineId and routineActivityId
  // JOIN username from users, aliased AS creatorName
  // JOIN duration and count from routine_activities
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
  // Fetches all routines by username, and where "isPublic" = true
  // Attach activities, including routineId and routineActivityId
  // JOIN username from users, aliased AS creatorName
  // JOIN duration and count from routine_activities
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
  // Fetches all routines where "isPublic" = true, associated with a specific activityId
  // Attach activities, including routineId and routineActivityId
  // JOIN username from users, aliased AS creatorName
  // JOIN duration and count from routine_activities
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

async function attachActivitiesToRoutines(routines, routineIds) {
  // Attaches activities to routines
  try {
    const { rows: activities } = await client.query(
      `
      SELECT activities.*, routine_activities."routineId"
      FROM activities
      JOIN routine_activities ON activities.id = routine_activities."activityId"
      WHERE routine_activities."routineId" = ANY($1);
      `,
      [routineIds]
    );

    for (const routine of routines) {
      const routineActivities = activities.filter(
        (activity) => activity.routineId === routine.id
      );
      routine.activities = routineActivities;
    }

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateRoutine({ id, ...fields }) {
  // Returns an updated routine
  // Updates ONLY the fields that have been changed
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
  // Removes a routine from the database
  // Removes all routine_activities from the routine being deleted
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
  attachActivitiesToRoutines,
  updateRoutine,
  destroyRoutine,
};
