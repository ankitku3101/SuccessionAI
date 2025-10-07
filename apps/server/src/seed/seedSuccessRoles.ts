import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import SuccessRole from "../models/SuccessRole";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/successionai";

const jsonFilePath = path.resolve(__dirname, "../data/success_roles.json");

const seedSuccessRoles = async () => {
  try {
    const data = fs.readFileSync(jsonFilePath, "utf-8");
    const jsonData = JSON.parse(data);

    if (!Array.isArray(jsonData)) {
      throw new Error("Invalid JSON format. Expected an array of roles.");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear old roles
    await SuccessRole.deleteMany({});
    console.log("Old success roles cleared");

    // Each entry will become one document
    const roles = jsonData.map((r: any) => ({
      role: r.role,
      role_description: r.role_description,
      required_experience: Number(r.required_experience) || 0,
      required_skills: Array.isArray(r.required_skills)
        ? r.required_skills
        : typeof r.required_skills === "string"
        ? r.required_skills.split(",").map((s: string) => s.trim())
        : [],
      min_performance_rating: Number(r.min_performance_rating) || 0,
      min_potential_rating: Number(r.min_potential_rating) || 0,
      required_scores: {
        technical: Number(r.required_scores?.technical) || 0,
        communication: Number(r.required_scores?.communication) || 0,
        leadership: Number(r.required_scores?.leadership) || 0,
      },
    }));

    const inserted = await SuccessRole.insertMany(roles);
    console.log(`Inserted ${inserted.length} success role documents.`);

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding success roles:", error);
    process.exit(1);
  }
};

seedSuccessRoles();
