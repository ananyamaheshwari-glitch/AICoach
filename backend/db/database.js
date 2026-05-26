// db/database.js
const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = './quiz.db';
const bcrypt = require('bcryptjs');

// A helper function to wrap sqlite3 calls in Promises
const dbRun = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error running sql ' + sql);
        console.error(err);
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
};

const dbAll = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    console.log('Connected to the SQLite database.');
    initializeDB();
  }
});

const initializeDB = async () => {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createQuestionsTable = `
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_text TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
            topic TEXT NOT NULL,
            question_type TEXT DEFAULT 'multiple_choice' CHECK(question_type IN ('multiple_choice', 'open_ended')),
            evaluation_criteria TEXT
        );
    `;

    const createResultsTable = `
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            quiz_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            score REAL NOT NULL,
            raw_answers TEXT NOT NULL,
            final_report TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    `;

    await dbRun(db, createUsersTable);
    await dbRun(db, createQuestionsTable);
    await dbRun(db, createResultsTable);

    // Seed data if questions table is empty
    const rows = await dbAll(db, 'SELECT COUNT(id) as count FROM questions');
    if (rows[0].count === 0) {
        console.log('Seeding database with questions...');

        // Multiple choice questions
        const seedQuestions = [
            ['Which of the following is an example of IaaS?', 'Google App Engine', 'Amazon EC2', 'Salesforce', 'Microsoft Office 365', 'B', 'Cloud', 'multiple_choice', null],
            ['What does "serverless" computing refer to?', 'Running code without any servers involved', 'A model where the cloud provider manages the server infrastructure', 'Using physical servers located in your own office', 'A type of virtualization technology', 'B', 'Cloud', 'multiple_choice', null],
            ['Which service is primarily used for object storage in AWS?', 'Amazon RDS', 'Amazon EBS', 'Amazon S3', 'Amazon Glacier', 'C', 'Cloud', 'multiple_choice', null],
            ['In cloud computing, what is "auto-scaling"?', 'Manually adding more servers', 'Automatically adjusting computational resources in response to load', 'A security feature to prevent unauthorized access', 'A billing model that charges a flat rate', 'B', 'Cloud', 'multiple_choice', null],
            ['What is the main benefit of a Content Delivery Network (CDN)?', 'Encrypting data at rest', 'Reducing latency by caching content closer to users', 'Providing relational database services', 'Automating software deployment', 'B', 'Cloud', 'multiple_choice', null],
        ];

        const insertSql = 'INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_option, topic, question_type, evaluation_criteria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        for (const q of seedQuestions) {
          await dbRun(db, insertSql, q);
        }
    }

    // Seed default user if users table is empty
    const users = await dbAll(db, 'SELECT COUNT(id) as count FROM users');
    if (users[0].count === 0) {
        console.log('Creating default user...');
        const username = 'testuser';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbRun(db, 'INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    }
};

module.exports = { db, dbRun, dbAll };
