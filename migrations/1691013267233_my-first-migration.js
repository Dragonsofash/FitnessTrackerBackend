/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create 'users' table
  pgm.createTable(pgm, "users", {
    id: { type: "SERIAL", primaryKey: true },
    username: { type: "VARCHAR(255)", notNull: true, unique: true },
    password: { type: "VARCHAR(255)", notNull: true },
  });

  // Create 'activities' table
  pgm.createTable(pgm, "activities", {
    id: { type: "SERIAL", primaryKey: true },
    name: { type: "VARCHAR(255)", notNull: true, unique: true },
    description: { type: "TEXT", notNull: true },
  });

  // Create 'routines' table
  pgm.createTable(pgm, "routines", {
    id: { type: "SERIAL", primaryKey: true },
    creatorId: { type: "INTEGER", references: "users(id)" },
    isPublic: { type: "BOOLEAN", default: false },
    name: { type: "VARCHAR(255)", notNull: true, unique: true },
    goal: { type: "TEXT", notNull: true },
  });

  // Create 'routine_activities' table
  pgm.createTable(pgm, "routine_activities", {
    id: { type: "SERIAL", primaryKey: true },
    routineId: { type: "INTEGER", references: "routines(id)" },
    activityId: { type: "INTEGER", references: "activities(id)" },
    duration: { type: "INTEGER" },
    count: { type: "INTEGER" },
  });
};
