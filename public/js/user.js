const mysql = require('mysql');

// db connection [encrypt needed!]
var connection = mysql.createConnection({
  host: 'definetestserver.iptime.org',
  user: 'root',
  password: 'define1101',
  database: 'Jeju_PK_DB'
});

module.exports = connection;
