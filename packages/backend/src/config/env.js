import dotenv from 'dotenv';

// Load .env before anything else
dotenv.config();

const requiredVars = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missing.join(', ')}\n` +
    `   Copy .env.example to .env and fill in the values.`
  );
  process.exit(1);
}

// Strict check for production environments
if (process.env.NODE_ENV === 'production') {
  const weakSecrets = ['secret', 'devsecret', 'dev_secret', '1234567890', 'campos_secret'];
  if (weakSecrets.includes((process.env.JWT_ACCESS_SECRET || '').toLowerCase()) || 
      weakSecrets.includes((process.env.JWT_REFRESH_SECRET || '').toLowerCase())) {
    console.error('❌ [DEPLOYMENT ERROR] JWT secrets cannot use weak default keys in production.');
    process.exit(1);
  }
}

const env = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '1h',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '30d',

  // Gemini API Key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  get isDev() {
    return this.NODE_ENV === 'development';
  },
  get isProd() {
    return this.NODE_ENV === 'production';
  },
});

export default env;
