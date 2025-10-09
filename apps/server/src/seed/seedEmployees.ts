import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcrypt";
import Employee from "../models/Employee";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/successionai";
const EMPLOYEE_CSV_PATH = path.resolve(__dirname, "../data/employee_dataset.csv");

interface CsvRow {
  name: string;
  role: string;
  department: string;
  education: string;
  recruitment_channel: string;
  number_of_trainings: string;
  age: string;
  length_of_service_years: string;
  experience_years: string;
  skills: string;
  performance_rating: string;
  assessment_technical: string;
  assessment_communication: string;
  assessment_leadership: string;
  potential_rating: string;
  target_success_role: string;
}

async function hashPassword(plainTextPassword: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainTextPassword, saltRounds);
}

async function seed(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const results: CsvRow[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(EMPLOYEE_CSV_PATH)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
        .on("data", (row: CsvRow) => {
          if (!row.assessment_technical || !row.assessment_communication || !row.assessment_leadership) {
            console.warn(`Missing assessment data for employee: ${row.name}`);
          }
          results.push(row);
        })
        .on("end", () => {
          console.log(`CSV parsing completed with ${results.length} records`);
          resolve();
        })
        .on("error", (error) => reject(error));
    });

    // Convert CSV rows to employee objects
    const employees = results.map((row, index) => ({
      id: index + 1,
      name: row.name,
      role: row.role,
      designation: Math.random() > 0.7 ? "SENIOR" : "JUNIOR",
      department: row.department,
      education: row.education,
      recruitment_channel: row.recruitment_channel,
      num_trainings: parseFloat(row.number_of_trainings) || 0,
      age: parseFloat(row.age) || 0,
      length_of_service_years: parseFloat(row.length_of_service_years) || 0,
      experience_years: parseFloat(row.experience_years) || 0,
      skills: row.skills ? row.skills.split(",").map((s) => s.trim()) : [],
      performance_rating: parseFloat(row.performance_rating) || 0,
      assessment_scores: {
        technical: parseFloat(row.assessment_technical) || 0,
        communication: parseFloat(row.assessment_communication) || 0,
        leadership: parseFloat(row.assessment_leadership) || 0,
      },
      potential_rating: parseFloat(row.potential_rating) || 0,
      target_success_role: row.target_success_role || "",
      mentorship: {
        mentor_id: null,
        requested_at: null,
        approved_at: null,
        status: "none",
      },
      development_plan: {
        goals: [],
        trainings: [],
        last_updated: new Date(),
      },
      user_role: "employee",
      email: undefined,
      password: undefined,
    }));

    /*
    // Please guys, just a request - you know what this does
    await Employee.deleteMany({});
    console.log("Cleared old employee records");
    */ 

    const insertedEmployees = await Employee.insertMany(employees);
    console.log(`Inserted ${insertedEmployees.length} employees`);

    // Committee Users
    const committeeUsersRaw = [
      {
        name: "Ankit Kumar",
        email: "ankit123@gmail.com",
        role: "HR Manager",
        department: "HR",
        designation: "SENIOR",
        user_role: "committee",
        password: "ankit123",
      },
      {
        name: "Mohanty Hitesh",
        email: "hitesh123@gmail.com",
        role: "Talent Lead",
        department: "HR",
        designation: "SENIOR",
        user_role: "committee",
        password: "hitesh123",
      },
    ];

    // Hash passwords before insert
    for (const user of committeeUsersRaw) {
      user.password = await hashPassword(user.password);
    }

    const insertedCommittee = await Employee.insertMany(committeeUsersRaw);
    console.log(`Inserted ${insertedCommittee.length} committee users`);

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
