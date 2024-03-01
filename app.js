// Import necessary modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose(); // Import sqlite3 module


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Set up Pug as view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');



// Initialize SQLite database
const db = new sqlite3.Database('./data/contacts.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    // Create the contacts table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      notes TEXT,
      created TEXT,
      lastEdited TEXT
    )`);
  }
});

// Function to read contacts from the SQLite database
function readContacts(callback) {
  db.all('SELECT * FROM contacts', (err, rows) => {
    if (err) {
      console.error('Error reading from database', err);
      callback([]);
    } else {
      callback(rows);
    }
  });
}

app.get('/', (req, res) => {
  res.render('index');
});

// Route to render the contacts page
app.get('/contacts', (req, res) => {
  readContacts((contacts) => {
    res.render('contacts', { contacts });
  });
});

// Route to render the new contact form
app.get('/contacts/new', (req, res) => {
  res.render('new');
});

// Route to render a single contact
app.get('/contacts/:id', (req, res) => {
  readContacts((contacts) => {
    const contact = contacts.find(c => c.id === req.params.id);
    if (!contact) {
      res.status(404).send('Contact not found');
    } else {
      // Format the dates before sending to the template
      contact.createdFormatted = new Date(contact.created).toLocaleString();
      contact.lastEditedFormatted = new Date(contact.lastEdited).toLocaleString();
      
      res.render('contact', { contact });
    }
  });
});

// Route to create a new contact
app.post('/contacts', (req, res) => {
  const newContact = {
    id: uuidv4(),
    ...req.body,
    created: new Date().toISOString(), // Store creation date/time
    lastEdited: new Date().toISOString() // Initialize last edited as creation time
  };
  const sql = `INSERT INTO contacts (id, firstName, lastName, email, notes, created, lastEdited) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [newContact.id, newContact.firstName, newContact.lastName, newContact.email, newContact.notes, newContact.created, newContact.lastEdited];
  db.run(sql, params, (err) => {
    if (err) {
      console.error('Error inserting into database', err);
      res.status(500).send('Error creating contact');
    } else {
      res.redirect(`/contacts/${newContact.id}`);
    }
  });
});


// Route to render the edit contact form
app.get('/contacts/:id/edit', (req, res) => {
  const sql = 'SELECT * FROM contacts WHERE id = ?';
  db.get(sql, [req.params.id], (err, contact) => {
    if (err) {
      console.error('Error reading from database', err);
      res.status(500).send('Error fetching contact');
    } else if (!contact) {
      res.status(404).send('Contact not found');
    } else {
      res.render('editContact', { contact });
    }
  });
});


// Route to update a contact
app.put('/contacts/:id', (req, res) => {
  const sql = `UPDATE contacts SET firstName = ?, lastName = ?, email = ?, notes = ?, lastEdited = ? WHERE id = ?`;
  const params = [req.body.firstName, req.body.lastName, req.body.email, req.body.notes, new Date().toISOString(), req.params.id];
  db.run(sql, params, (err) => {
    if (err) {
      console.error('Error updating database', err);
      res.status(500).send('Error updating contact');
    } else {
      res.redirect(`/contacts/${req.params.id}`);
    }
  });
});

// Route to delete a contact
app.delete('/contacts/:id', (req, res) => {
  const sql = `DELETE FROM contacts WHERE id = ?`;
  const params = [req.params.id];
  db.run(sql, params, (err) => {
    if (err) {
      console.error('Error deleting from database', err);
      res.status(500).send('Error deleting contact');
    } else {
      res.redirect('/contacts');
    }
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


// Start the server
app.listen(3000, () => console.log('Server started on port 3000'));
