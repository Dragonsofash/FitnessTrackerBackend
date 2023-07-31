const client = require("./client");

async function addActivityToRoutine({
  routineId,
  activityId,
  count,
  duration,
}) {
  try {
    const {
      rows: [routineActivity],
    } = await client.query(
      `
      INSERT INTO routine_activities ("routineId", "activityId", count, duration)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [routineId, activityId, count, duration]
    );

    return routineActivity;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRoutineActivityById(id) {
  try {
    const {
      rows: [routineActivity],
    } = await client.query(
      `
      SELECT *
      FROM routine_activities
      WHERE id = $1;
      `,
      [id]
    );

    return routineActivity;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getRoutineActivitiesByRoutine({ id }) {
  try {
    const { rows: routineActivities } = await client.query(
      `
      SELECT *
      FROM routine_activities
      WHERE id = $1;
      `,
      [id]
    );

    return routineActivities;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateRoutineActivity({ id, ...fields }) {
  try {
    const fieldEntries = Object.entries(fields);
    const fieldUpdates = fieldEntries.map(([key, value], index) => {
      return `${key} = $${index + 2}`;
    });

    const query = `
      UPDATE routine_activities
      SET ${fieldUpdates.join(", ")}
      WHERE id = $1
      RETURNING *;
    `;

    const values = [id, ...fieldEntries.map(([, value]) => value)];
    const {
      rows: [updatedRoutineActivity],
    } = await client.query(query, values);

    return updatedRoutineActivity;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function destroyRoutineActivity(id) {
  try {
    const {
      rows: [deletedRoutineActivity],
    } = await client.query(
      `
      DELETE FROM routine_activities
      WHERE id = $1
      RETURNING *;
      `,
      [id]
    );

    return deletedRoutineActivity;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function canEditRoutineActivity(routineActivityId, userId) {
  try {
    const {
      rows: [routineActivity],
    } = await client.query(
      `
      SELECT "creatorId"
      FROM routine_activities
      JOIN routines ON "routineId" = routines.id
      WHERE routine_activities.id = $1;
      `,
      [routineActivityId]
    );

    return routineActivity && routineActivity.creatorId === userId;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  getRoutineActivityById,
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
  updateRoutineActivity,
  destroyRoutineActivity,
  canEditRoutineActivity,
};
