import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import Employee from "../models/Employee";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/successionai";

const results: any[] = [];

fs.createReadStream(path.resolve(__dirname, "../data/employee_dataset.csv"))
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", async () => {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("Connected to MongoDB");

      // Clear existing data
      await Employee.deleteMany({});
      console.log("Old data cleared");

      // Transform CSV rows into Employee objects
      const employees = results.map((row) => ({
        name: row.name,
        role: row.role,
        department: row.department,
        education: row.education,
        recruitment_channel: row.recruitment_channel,
        num_trainings: parseFloat(row.num_trainings) || 0,
        age: parseFloat(row.age) || 0,
        length_of_service_years: parseFloat(row.length_of_service_years) || 0,
        experience_years: parseFloat(row.experience_years) || 0,
        skills: row.skills ? row.skills.split(",").map((s: string) => s.trim()) : [],

        performance_rating: parseFloat(row.performance_rating) || 0,
        assessment_scores: {
          technical: parseFloat(row.technical) || 0,
          communication: parseFloat(row.communication) || 0,
          leadership: parseFloat(row.leadership) || 0,
        },
        potential_rating: parseFloat(row.potential_rating) || 0,
        target_success_role: row.target_success_role,
      }));

      const inserted = await Employee.insertMany(employees);
      console.log(`Inserted ${inserted.length} employees.`);

      process.exit(0);
    } catch (error) {
      console.error("Error seeding data:", error);
      process.exit(1);
    }
  });
