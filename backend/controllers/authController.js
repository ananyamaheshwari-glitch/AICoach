const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const config = require('../config');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const result = await AuthService.registerUser(username, password);
    if (!result.success) {
      return res.status(409).json({ message: result.message });
    }
    res.status(201).json(result);
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
    const result = await AuthService.loginUser(username, password);
    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    req.session.user = result.user;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out, please try again.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logout successful.' });
  });
};

exports.checkStatus = (req, res) => {
  if (req.session && req.session.user) {
    const sessionInfo = AuthService.getSessionInfo(req.session, config);
    res.json({
      user: req.session.user,
      session: sessionInfo
    });
  } else {
    res.status(401).json({ user: null, session: null });
  }
};
