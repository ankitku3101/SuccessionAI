import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  technical: Number,
  communication: Number,
  leadership: Number,
}, { _id: false });

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
  user_role: { type: String, enum: ["employee", "committee"], default: "employee" },
  email: { type: String, index: true, sparse: true },
  password: { type: String, select: false },
}, {
  timestamps: true
});

// helpful indexes
employeeSchema.index({ role: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ experience_years: -1 });
employeeSchema.index({ user_role: 1 });

export default mongoose.model("Employee", employeeSchema);
