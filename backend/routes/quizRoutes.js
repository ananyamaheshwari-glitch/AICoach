const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { getQuestionsByTopic, submitQuiz, getResultById } = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const submitQuizValidation = [
  body('user_answers')
    .isObject()
    .withMessage('user_answers must be an object'),
  body('user_answers')
    .custom((value) => {
      if (Object.keys(value).length === 0) {
        throw new Error('At least one answer is required');
      }
      return true;
    }),
  body('user_answers.*')
    .optional()
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Each answer must be A, B, C, or D')
];

const topicValidation = [
  param('topic')
    .notEmpty()
    .withMessage('Topic is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Topic must be between 1 and 100 characters')
    .trim()
];

const resultIdValidation = [
  param('resultId')
    .isInt({ min: 1 })
    .withMessage('Result ID must be a positive integer')
];

router.get('/questions/:topic', authMiddleware, topicValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid topic provided', errors: errors.array() });
  }
  next();
}, getQuestionsByTopic);

router.post('/submit', authMiddleware, submitQuizValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid answers provided', errors: errors.array() });
  }
  next();
}, submitQuiz);

router.get('/results/:resultId', authMiddleware, resultIdValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid result ID', errors: errors.array() });
  }
  next();
}, getResultById);

module.exports = router;
