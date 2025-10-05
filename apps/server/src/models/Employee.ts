import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  technical: Number,
  communication: Number,
  leadership: Number,
});

const employeeSchema = new mongoose.Schema({
  id: Number,
  name: String,
  role: String,
  department: String,
  education: String,
  recruitment_channel: String,
  num_trainings: Number,
  age: Number,
  length_of_service_years: Number,
  experience_years: Number,
  skills: [String],
  performance_rating: Number,
  assessment_scores: assessmentSchema,
  potential_rating: Number,
  target_success_role: String,
});

export default mongoose.model("Employee", employeeSchema);
