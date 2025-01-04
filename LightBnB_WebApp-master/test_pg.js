const { Pool } = require('pg');
console.log('pg module loaded successfully');


const getAllProperties = (options, limit = 10) => {
  // Start building the query string
  let query = `
    SELECT *
    FROM properties
    WHERE 1 = 1
  `;

  const queryParams = [];

  // Add filters from options (e.g., minimum price, city)
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    query += ` AND city LIKE $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night) * 100); // Convert to cents
    query += ` AND cost_per_night >= $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night) * 100); // Convert to cents
    query += ` AND cost_per_night <= $${queryParams.length}`;
  }

  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    query += ` AND average_rating >= $${queryParams.length}`;
  }

  // Add LIMIT clause
  queryParams.push(limit);
  query += `
    LIMIT $${queryParams.length};
  `;

  // Execute the query
  return pool
    .query(query, queryParams)
    .then((res) => res.rows)
    .catch((err) => {
      console.error("Query error:", err.stack);
      return null;
    });
};

