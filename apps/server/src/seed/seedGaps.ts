import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import connectDB from '../config/mongo';
import GapModel from '../models/Gap';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedGaps = async () => {
  await connectDB();

  try {
    // Construct the path to the JSON file
    const jsonPath = path.resolve(__dirname, '../../../../gaps_dataset.json');
    
    // Read and parse the JSON file
    const gapsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Clear existing data
    await GapModel.deleteMany({});
    console.log('Previous gap data cleared.');

    // Insert new data
    await GapModel.insertMany(gapsData);
    console.log('Gap data has been successfully seeded!');
    
  } catch (error) {
    console.error('Error seeding gap data:', error);
  } finally {
    // Disconnect from the database
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit();
  }
};

seedGaps();
