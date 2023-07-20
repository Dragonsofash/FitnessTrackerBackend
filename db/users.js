const client = require("./client");
require("dotenv").config();

// database functions

// user functions
async function createUser({ username, password }) {
  // const SALT_COUNT = 10;

  // const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
  const {
    rows: [user],
  } = await client.query(
    `
        INSERT INTO users(username, password) 
        VALUES($1, $2) 
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `,
    [username, password]
  );

  return user;
}

async function getUser({ username, password }) {
  // const user = await getUserByUsername(username);
  // const hashedPassword = user.password;
  // isValid will be a boolean based on wether the password matches the hashed password
  // const isValid = await bcrypt.compare(password, hashedPassword);
}

async function getUserById(userId) {
  const {
    rows: [user],
  } = await client.query(
    `SELECT id, username, password
        FROM users
        WHERE id= $1`,
    [userId]
  );

  // if it doesn't exist (if there are no `rows` or `rows.length`), return null
  if (!user) {
    return null;
  }

  // if it does:
  // delete the 'password' key from the returned object
  delete user.password;

  // return the user object
  return user;
}

async function getUserByUsername(username) {
  const {
    rows: [user],
  } = await client.query(
    `
    SELECT *
    FROM users
    WHERE username=$1;
  `,
    [username]
  );

  return user;
}

module.exports = {
  createUser,
  getUser,
  getUserById,
  getUserByUsername,
};
