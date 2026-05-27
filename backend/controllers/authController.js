// controllers/authController.js
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { db, dbRun, dbAll } = require('../db/database');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const existingUser = await dbAll(db, 'SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbRun(db, 'INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'User created successfully.', userId: result.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.', error });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const users = await dbAll(db, 'SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      console.warn(`Login attempt for non-existent user: ${username} `);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Create a session for the user
    const sessionUser = { id: user.id, username: user.username };
    req.session.user = sessionUser;
    console.log(`Successful login for user: ${username}`);

    res.json({ message: 'Login successful.', user: sessionUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out, please try again.' });
    }
    res.clearCookie('connect.sid'); // The default session cookie name
    return res.status(200).json({ message: 'Logout successful.' });
  });
};

exports.checkStatus = (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ user: null });
  }
};
