const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, logout, checkStatus } = require('../controllers/authController');
const router = express.Router();

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .custom((value) => {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);

      if (!hasUpperCase) {
        throw new Error('Password must contain at least one uppercase letter (A-Z)');
      }
      if (!hasLowerCase) {
        throw new Error('Password must contain at least one lowercase letter (a-z)');
      }
      if (!hasNumber) {
        throw new Error('Password must contain at least one number (0-9)');
      }
      return true;
    })
];

const loginValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .custom((value) => {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);

      if (!hasUpperCase) {
        throw new Error('Password must contain at least one uppercase letter (A-Z)');
      }
      if (!hasLowerCase) {
        throw new Error('Password must contain at least one lowercase letter (a-z)');
      }
      if (!hasNumber) {
        throw new Error('Password must contain at least one number (0-9)');
      }
      return true;
    })
];

const loginLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 20,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 20,
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', logout);
router.get('/status', checkStatus);

module.exports = router;
