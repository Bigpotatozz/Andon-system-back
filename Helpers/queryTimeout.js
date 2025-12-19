/*
const queryWithTimeout = (query, params, timeout = 2000) => {
  return Promise.race([
    pool.query(query, params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeout)
    ),
  ]);
};

module.exports = { queryWithTimeout };
*/
