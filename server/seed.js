import 'dotenv/config';
import mongoose from 'mongoose';
import { ensureDemoData } from './services/seedService.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dulingo';
console.log(`Connecting to MongoDB at ${mongoUri.replace(/:[^:@]+@/, ':****@')} ...`);

await mongoose.connect(mongoUri);
await ensureDemoData();
console.log('✅ Seeded successfully!');
console.log('👩‍🏫 Demo Teacher: teacher@dulingo.in / demo1234');
console.log('👨‍🎓 Demo Learner: ramesh@dulingo.in / demo1234');
await mongoose.disconnect();
