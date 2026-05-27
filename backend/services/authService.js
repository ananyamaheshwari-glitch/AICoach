const bcrypt = require('bcryptjs');
const { db, dbAll, dbRun } = require('../db/database');

class AuthService {
  static async registerUser(username, password) {
    try {
      const existingUser = await dbAll(db, 'SELECT * FROM users WHERE username = ?', [username]);
      if (existingUser.length > 0) {
        return { success: false, message: 'Username already exists.' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await dbRun(db, 'INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

      return {
        success: true,
        message: 'User created successfully.',
        userId: result.id
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  static async loginUser(username, password) {
    try {
      const users = await dbAll(db, 'SELECT * FROM users WHERE username = ?', [username]);

      if (users.length === 0) {
        console.warn(`Login attempt for non-existent user: ${username}`);
        return { success: false, message: 'Invalid credentials.' };
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.warn(`Failed login attempt for user: ${username}`);
        return { success: false, message: 'Invalid credentials.' };
      }

      console.log(`Successful login for user: ${username}`);
      return {
        success: true,
        message: 'Login successful.',
        user: { id: user.id, username: user.username }
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  static getSessionInfo(session, config) {
    if (!session || !session.user) {
      return null;
    }

    const now = Date.now();
    const sessionRemainingMs = session.cookie._expires - now;
    const warningTimeMs = config.session.warningTime;
    const sessionMaxAgeMs = config.session.maxAge;
    const isExpiringSoon = sessionRemainingMs < warningTimeMs;
    const expiresAt = new Date(session.cookie._expires);

    return {
      expiresAt,
      remainingTimeMs: Math.max(0, sessionRemainingMs),
      isExpiringSoon,
      warningTimeMs,
      sessionMaxAgeMs
    };
  }
}

module.exports = AuthService;
