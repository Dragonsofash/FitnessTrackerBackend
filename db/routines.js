const client = require("./client");
const { addActivityToRoutine } = require("./routine_activities");
const { attachActivitiesToRoutines } = require("./activities");

async function createRoutine({ creatorId, isPublic, name, goal }) {
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

    const { rows: activities } = await client.query(
      `
      SELECT activities.*
      FROM activities
      JOIN routine_activities ON activities.id = routine_activities."activityId"
      WHERE routine_activities."routineId" = $1;
      `,
      [id]
    );

    if (!routine) {
      throw {
        name: "RoutineNotFoundERROR",
        message: "Could not find a routine with that id.",
      };
    }

    routine.activities = activities;
    return routine;
  } catch (error) {
    console.error(error);
  }
}

async function getRoutinesWithoutActivities() {
  try {
    const { rows: routines } = await client.query(
      `
      SELECT *
      FROM routines
      WHERE routine_activities.activityId IS NULL;
      `
    );

    return routines;
  } catch (error) {
    console.error(error);
  }
}

async function getAllRoutines() {
  try {
    const { rows: routines } = await client.query(
      `
      SELECT *
      FROM routines;
      `
    );

    // const routines = await Promise.all(
    //   routineIds.map((routine) => getRoutineById(routine.id))
    // );

    return routines;
  } catch (error) {
    console.error;
    throw error;
  }
}

async function getAllPublicRoutines() {
  try {
    const { rows: routine } = await client.query(`
      SELECT *
      FROM routines
      WHERE "isPublic" = true;
    `);

    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getAllRoutinesByUser({ username }) {
  try {
    const { rows: routine } = await client.query(
      `
      SELECT *
      FROM routines
      WHERE "creatorId" = $1;
      `,
      [username]
    );

    const routines = await Promise.all(
      routine.map((routine) => getRoutineById(routine.id))
    );

    return routines;
  } catch (error) {
    console.error(error);
  }
}

async function getPublicRoutinesByUser({ username }) {
  try {
    const { rows: routines } = await client.query(
      `
      SELECT *
      FROM routines
      WHERE "isPublic" = true AND "creatorId" = $1;
      `,
      [username]
    );

    await attachActivitiesToRoutines(rows);

    return routines;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getPublicRoutinesByActivity({ id }) {
  try {
    const { rows: routine } = await client.query(
      `
      SELECT routines.*
      FROM routines
      JOIN routine_activities ON routines.id = routine_activities."routineId"
      WHERE routines."isPublic" = true AND routine_activities."activityId" = $1;
      `,
      [id]
    );

    await attachActivitiesToRoutines(routine);

    return routine;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateRoutine({ id, ...fields }) {
  try {
    // read off the activities & remove that field
    const { activities } = fields;
    delete fields.activities;

    // build the set string
    const setString = Object.keys(fields)
      .map((key, index) => `"${key}"=$${index + 1}`)
      .join(", ");

    // update any fields that need to be updated
    if (setString.length > 0) {
      await client.query(
        `
          UPDATE routines
          SET ${setString}
          WHERE id = $${Object.keys(fields).length + 1}
          RETURNING *;
        `,
        [...Object.values(fields), id]
      );
    }

    // return early if there's no activities to update
    if (activities === undefined) {
      return await getRoutineById(id);
    }

    for (const activity of activities) {
      await addActivityToRoutine(
        id,
        activity.id,
        activity.count,
        activity.duration
      );
    }

    return await getRoutineById(id);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function destroyRoutine(id) {
  try {
    const { rows: routineActivities } = await client.query(
      `
      DELETE FROM routine_activities
      WHERE "routineId" = $1;
      `,
      [id]
    );

    const { rows: routines } = await client.query(
      `
      DELETE FROM routines
      WHERE id = $1;
      `,
      [id]
    );

    return routineActivities && routines;
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
