import mongoose from "mongoose";

const SuccessRoleSchema = new mongoose.Schema({
  role: { type: String, required: true },
  role_description: { type: String },
  required_experience: { type: Number, default: 0 },
  required_skills: { type: [String], default: [] },
  min_performance_rating: { type: Number, default: 0 },
  min_potential_rating: { type: Number, default: 0 },
  required_scores: {
    technical: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    leadership: { type: Number, default: 0 },
  },
});

export default mongoose.models.SuccessRole ||
  mongoose.model("Success_Role", SuccessRoleSchema);
