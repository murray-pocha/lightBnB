const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require("pg");

/// Users
const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});


module.exports = pool;



// Test the connection
pool.query('SELECT NOW()')
  .then(res => console.log('Connection successful:', res.rows))
  .catch(err => console.error('Connection error:', err.stack));


/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1;`, [email.toLowerCase()])
    .then((result) => {
      console.log("Database Query Result:", result.rows[0]);
      if (result.rows.length === 0) {
        return null; // if no user found
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.error('Query error:', err.stack);
    });
};

getUserWithEmail('testuser@example.com')
  .then((user) => console.log(user))
  .catch((err) => console.error(err));

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      return result.rows[0] || null;
    })
    .catch((err) => {
      console.error('Query error:', err.stack);
      throw err;
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const bcrypt = require("bcrypt");

const addUser = function(user) {
  const hashedPassword = bcrypt.hashSync(user.password, 12); // Hash the password
  const query = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [user.name, user.email, hashedPassword]; // Use the hashed password

  return pool
    .query(query, values)
    .then((result) => result.rows[0]) // Return the inserted user
    .catch((err) => {
      console.error("Error adding user:", err);
      throw err; // Rethrow the error for further handling
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => result.rows)
    .catch((err) => {
      console.error("Query error:", err.stack);
      throw err;
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};


const newUser = {
  name: "Test User",
  email: "testuser@example.com",
  password: "password123" // Ensure these values are unique
};

addUser(newUser)
  .then(user => {
    console.log("User added:", user);
  })
  .catch(err => console.error("Error adding user:", err));


module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
