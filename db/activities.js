const client = require("./client");

// database functions
async function createActivity({ name, description }) {
  // return the new activity
  const {
    rows: [activity],
  } = await client.query(
    `
    INSERT INTO activities(name, description)
    VALUES($1, $2)
    RETURNING *;
    `,
    [name, description]
  );

  return activity;
}

async function getAllActivities() {
  // select and return an array of all activities
  try {
    const { rows: activityIds } = await client.query(`
    SELECT id
    FROM activities;
  `);

  const activities = await Promise.all(
    activityIds.map((activity) => getActivityById(activity.id))
  );

  return activities;
  } catch (error) {
    throw
  }
  
}

async function getActivityById(id) {}

async function getActivityByName(name) {}

// used as a helper inside db/routines.js
async function attachActivitiesToRoutines(routines) {}

async function updateActivity({ id, ...fields }) {
  // don't try to update the id
  // do update the name and description
  // return the updated activity
}

module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
  updateActivity,
};
