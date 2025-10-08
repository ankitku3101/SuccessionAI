import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcrypt";
import Employee from "../models/Employee";
import connectDB from "../config/mongo";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const seedEmployees = async () => {
  await connectDB();

  try {
    // Construct the path to the JSON file
    const jsonPath = path.resolve(__dirname, '../data/employees_dataset.json');
    
    // Read and parse the JSON file
    const employeesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Clear existing data
    await Employee.deleteMany({});
    console.log('Previous employee data cleared.');

    // Hash passwords for users that have them
    const processedEmployees = await Promise.all(employeesData.map(async (emp: any) => {
      if (emp.password) {
        const salt = await bcrypt.genSalt(10);
        emp.password = await bcrypt.hash(emp.password, salt);
      }
      return emp;
    }));

    // Insert new data
    await Employee.insertMany(processedEmployees);
    console.log(`${processedEmployees.length} employees have been successfully seeded!`);
    
  } catch (error) {
    console.error('Error seeding employee data:', error);
  } finally {
    // Disconnect from the database
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit();
  }
};

seedEmployees();
