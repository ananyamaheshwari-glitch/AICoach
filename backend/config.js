// config/config.js
require('dotenv').config();

const config = {
  port: process.env.PORT || 3007,
  nodeEnv: process.env.NODE_ENV || 'development',
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours (in milliseconds)
    warningTime: 1000 * 60 * 15, // Warn user 15 minutes before expiration
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5181',
  },
  huggingface: {
    token: process.env.HUGGINGFACE_HUB_TOKEN,
    model: process.env.AI_MODEL || 'meta-llama/Llama-3.1-8B-Instruct',
    max_tokens: 2048,
  },
};

// Validate that essential environment variables are loaded.
if (!config.huggingface.token) {
  console.error("\nFATAL ERROR: HUGGINGFACE_HUB_TOKEN is not set.");
  console.error("Please create a .env file in the 'backend' directory and add your Hugging Face API token.\n");
  process.exit(1); // Exit the application with an error code.
}

if (!process.env.SESSION_SECRET) {
  console.error("\nFATAL ERROR: SESSION_SECRET is not set.");
  console.error("Please create a .env file in the 'backend' directory and add a strong SESSION_SECRET.\n");
  process.exit(1);
}

module.exports = config;