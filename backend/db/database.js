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

        // Google Cloud Platform Quiz (10 questions)
        const seedQuestions = [
            ['Which Google Cloud service is used for managed relational databases?', 'Cloud Storage', 'Cloud SQL', 'Cloud Datastore', 'Cloud Spanner', 'B', 'Google Cloud Platform', 'multiple_choice', null],
            ['What is the primary purpose of Google Cloud Pub/Sub?', 'Object storage in the cloud', 'Real-time messaging and event ingestion', 'Managing virtual machine instances', 'Monitoring and logging applications', 'B', 'Google Cloud Platform', 'multiple_choice', null],
            ['Which Google Cloud service allows you to run serverless functions?', 'Compute Engine', 'App Engine', 'Cloud Functions', 'Cloud Run', 'C', 'Google Cloud Platform', 'multiple_choice', null],
            ['What does GCP stand for?', 'Google Cloud Provider', 'Google Compute Platform', 'Google Cloud Platform', 'Global Cloud Provider', 'C', 'Google Cloud Platform', 'multiple_choice', null],
            ['Which service in Google Cloud is used for distributed data processing and analytics?', 'Cloud Firestore', 'BigQuery', 'Cloud Dataflow', 'All of the above', 'D', 'Google Cloud Platform', 'multiple_choice', null],
            ['Which Google Cloud service provides NoSQL document storage?', 'Cloud SQL', 'Cloud Datastore', 'Cloud Firestore', 'Cloud Spanner', 'C', 'Google Cloud Platform', 'multiple_choice', null],
            ['What is Google Cloud Storage primarily used for?', 'Running virtual machines', 'Storing and retrieving objects at scale', 'Managing relational databases', 'Processing streaming data', 'B', 'Google Cloud Platform', 'multiple_choice', null],
            ['Which GCP service is used for deploying and managing containerized applications?', 'Compute Engine', 'App Engine', 'Google Kubernetes Engine', 'Cloud Functions', 'C', 'Google Cloud Platform', 'multiple_choice', null],
            ['What is the purpose of Google Cloud Identity and Access Management (IAM)?', 'Storing encrypted secrets', 'Managing user access and permissions', 'Monitoring application performance', 'Backing up data', 'B', 'Google Cloud Platform', 'multiple_choice', null],
            ['Which GCP service is used for building and managing machine learning models?', 'Vertex AI', 'BigQuery ML', 'Cloud AutoML', 'All of the above', 'D', 'Google Cloud Platform', 'multiple_choice', null],
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
