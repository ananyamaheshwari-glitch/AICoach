const express = require('express');
const { body } = require('express-validator');
const { getQuestionsByTopic, submitQuiz, getResultById } = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const submitQuizValidation = [
  body('user_answers').isObject().notEmpty()
];

router.get('/questions/:topic', authMiddleware, getQuestionsByTopic);
router.post('/submit', authMiddleware, submitQuizValidation, submitQuiz);
router.get('/results/:resultId', authMiddleware, getResultById);

module.exports = router;
