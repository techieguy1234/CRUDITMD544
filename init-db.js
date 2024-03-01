const sqlite3 = require('sqlite3').verbose();

// Open the database
let db = new sqlite3.Database('./data/contacts.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the contacts database.');
  }
});

// Create the contacts table
db.run(`CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  firstName TEXT,
  lastName TEXT,
  email TEXT,
  notes TEXT,
  created TEXT,
  lastEdited TEXT
)`, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Contacts table created.');
  }
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Database connection closed.');
  }
});
