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
 * @param {number}
 * @return {Promise<[{}]>} A promise to the reservations.
 */
 // a promise to the reservation

const getAllReservations = function (guest_id, limit = 10) {
  console.log("getAllReservations called with guest_id:", guest_id);

  const query = `
  SELECT reservations.*, properties.*, COALESCE(AVG(property_reviews.rating), 0) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `;

  const values = [guest_id, limit];
  console.log("Query being executed:", query);
  console.log("Values passed:", values);

  return pool
  .query(query, values)
  .then((result) => {
    console.log("getAllReservations Result:", result.rows);
    console.log("Query Result:", result.rows);
    return result.rows
  })

  .catch((err) => {
    console.error('Error executing query:', err.stack);
    throw err;
  });
};


/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  let whereClauses = [];
  // Handle filtering options
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    whereClauses.push(`city LIKE $${queryParams.length}`);
  }
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    whereClauses.push(`owner_id = $${queryParams.length}`);
  }
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100, options.maximum_price_per_night * 100);
    whereClauses.push(`cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryString += `WHERE ${whereClauses.join(' AND ')} `;
  }

  queryString += `GROUP BY properties.id `;

  // Use HAVING for minimum_rating
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then((res) => res.rows)
    .catch((err) => {
      console.error("Error executing query:", err.stack);
      throw err;
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = function (property) {
  const queryString = `
    INSERT INTO properties (
      owner_id, title, description, thumbnail_photo_url, 
      cover_photo_url, cost_per_night, street, city, province, 
      post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *;
  `;

  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  return pool
    .query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(err => {
      console.error(err.message);
      throw err;
    });
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

pool
  .query('SELECT * FROM reservations WHERE guest_id = 1029;')
  .then((res) => console.log('Direct Test Query Result:', res.rows))
  .catch((err) => console.error('Direct Test Query Error:', err.stack));