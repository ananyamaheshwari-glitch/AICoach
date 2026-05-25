const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const config = require('./config.js');
require('./db/database.js'); // Initializes DB connection and schema

const app = express();
const PORT = config.port;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: false }));

// Session Middleware Setup
app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db', // Will store sessions in a separate file
      dir: './db', // Directory to store the session database
    }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: config.session.maxAge,
      secure: config.nodeEnv === 'production', // Use secure cookies in production
      httpOnly: true,
      sameSite: 'strict', // CSRF protection: restrict cross-site cookie sending
    },
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

app.get('/', (req, res) => {
  res.send('AI Quiz Backend is running!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  const message = config.nodeEnv === 'production'
    ? 'An error occurred processing your request'
    : err.message;
  res.status(500).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
