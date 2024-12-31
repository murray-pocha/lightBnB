SELECT 
  reservations.id AS reservation_id,
  properties.title,
  reservations.start_date,
  properties.cost_per_night,
  AVG(property_reviews.rating) AS average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1
GROUP BY reservations.id, properties.title, reservations.start_date, properties.cost_per_night
ORDER BY reservations.start_date
LIMIT 10;