const client = require("./client");

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
  // Fetch a routine by its id
  try {
    const {
      rows: [routine],
    } = await client.query(
      `
      SELECT *
      FROM routines
      WHERE id = $1;
      `,
      [id]
    );

    const {
      rows: [username],
    } = await client.query(`
    SELECT username
    FROM users
    JOIN routines ON users.id=routines."creatorId"
    WHERE routines."creatorId"=${routine.creatorId};
    `);

    routine.creatorName = username.username;

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
    const { rows: routineIds } = await client.query(
      `
      SELECT id
      FROM routines
      `
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    await Promise.all(
      routines.map(
        (routine) => (routine.activities = attachActivitiesToRoutines(routine))
      )
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
      SELECT routines.*
      FROM routines
      WHERE "isPublic" = true;
      `
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    await Promise.all(
      routines.map(
        (routine) => (routine.activities = attachActivitiesToRoutines(routine))
      )
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
      SELECT routines.*
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      WHERE users.username = $1;
      `,
      [username]
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    await Promise.all(
      routines.map(
        (routine) => (routine.activities = attachActivitiesToRoutines(routine))
      )
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
      SELECT routines.*
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      WHERE "isPublic" = true AND users.username = $1;
      `,
      [username]
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    await Promise.all(
      routines.map(
        (routine) => (routine.activities = attachActivitiesToRoutines(routine))
      )
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
      SELECT routines.*
      FROM routines
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      WHERE routines."isPublic" = true AND routine_activities."activityId" = $1;
      `,
      [id]
    );

    const routines = await Promise.all(
      routineIds.map((routine) => getRoutineById(routine.id))
    );

    await Promise.all(
      routines.map(
        (routine) => (routine.activities = attachActivitiesToRoutines(routine))
      )
    );

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function attachActivitiesToRoutines(routine) {
  // Attaches activities to routines
  try {
    const { rows: activities } = await client.query(
      `
      SELECT activities.*
      FROM activities
      JOIN routine_activities ON activities.id = routine_activities."activityId"
      WHERE routine_activities."routineId" = $1;
      `,
      [routine.id]
    );

    const { rows: routine_activities } = await client.query(
      `
      SELECT routine_activities.*
      FROM routine_activities
      JOIN activities ON routine_activities."activityId" = activities.id
      WHERE routine_activities."routineId" = $1;
      `,
      [routine.id]
    );

    activities.map((activity) =>
      routine_activities.filter((routine_activity) => {
        if (activity.id === routine_activity.activityId) {
          activity.count = routine_activity.count;
          activity.duration = routine_activity.duration;
          activity.routineId = routine_activity.routineId;
          activity.routineActivityId = routine_activity.id;
        }
      })
    );

    routine.activities = activities;
    return activities;
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
    const { rows: routineActivities } = await client.query(
      `
      DELETE FROM routine_activities
      WHERE "routineId" = $1;
      `,
      [id]
    );

    const { rows: routine } = await client.query(
      `
      DELETE FROM routines
      WHERE id = $1;
      `,
      [id]
    );

    return routineActivities && routine;
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
