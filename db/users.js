const client = require("./client");
require("dotenv").config();
const bcrypt = require("bcrypt");
const SALT_COUNT = 10;

// database functions

// user functions
async function createUser({ username, password }) {
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
  let userToAdd = { username, hashedPassword };
  try {
    const {
      rows: [user],
    } = await client.query(
      `
          INSERT INTO users(username, password) 
          VALUES($1, $2) 
          ON CONFLICT (username) DO NOTHING 
          RETURNING *;
        `,
      [username, hashedPassword]
    );

    delete user.password;
    return userToAdd;
  } catch (error) {
    throw error;
  }
}

async function getUser({ username, password }) {
  const user = await getUserByUsername(username);
  const hashedPassword = user.password;
  // isValid will be a boolean based on wether the password matches the hashed password
  let passwordsMatch = await bcrypt.compare(password, hashedPassword);
  if (passwordsMatch) {
    // return the user object (without the password)
    delete user.password;
    return user;
  } else {
    return null;
  }
}

//   const isValid = await bcrypt.compare(password, hashedPassword);
//   try {
//     const {
//       rows: [user],
//     } = await client.query(
//       `SELECT *
//         FROM users
//         WHERE id= $1`
//     );

//     // if it doesn't exist (if there are no `rows` or `rows.length`), return null
//     if (!isValid) {
//       return null;
//     }

//     // if it does:
//     // delete the 'password' key from the returned object
//     delete user.password;

//     // return the user object
//     return user;
//   } catch (error) {
//     throw error;
//   }
// }

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `SELECT id, username
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

    // then add the posts to the user object with key 'posts'
    // return the user object
    return user;
  } catch (error) {
    throw error;
  }
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
