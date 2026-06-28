import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env variables from backend .env
dotenv.config({ path: '/Users/vardaangahlot/Projects/CampOS/Prototype 3/packages/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campos';

// Define User Schema inline
const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  mustChangePassword: Boolean,
});

const User = mongoose.model('User', UserSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');
    const users = await User.find();
    console.log(`Found ${users.length} total users.`);
    users.forEach(u => {
      console.log(`- Name: ${u.firstName} ${u.lastName} | Email: ${u.email} | Role: ${u.role} | MustChangePassword: ${u.mustChangePassword}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
