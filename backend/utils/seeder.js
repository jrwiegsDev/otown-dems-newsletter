// backend/utils/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const users = require('../data/users');
const subscribers = require('../data/subscribers'); // 1. IMPORT SUBSCRIBERS
const User = require('../models/userModel');
const Subscriber = require('../models/subscriberModel'); // 2. IMPORT SUBSCRIBER MODEL

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeder...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Subscriber.deleteMany();

    // Hash user passwords before saving
    const createdUsers = users.map(user => {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(user.password, salt);
      return { ...user, password: hashedPassword };
    });

    // Filter out any invalid subscriber entries before inserting
    const validSubscribers = subscribers.filter(sub => sub && sub.email);

    await User.insertMany(createdUsers);
    await Subscriber.insertMany(validSubscribers); // Use the filtered list

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Subscriber.deleteMany(); // Also clear subscribers on destroy
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const runSeeder = async () => {
  await connectDB();

  if (process.argv[2] === '-d') {
    await destroyData();
  } else {
    await importData();
  }
};

runSeeder();