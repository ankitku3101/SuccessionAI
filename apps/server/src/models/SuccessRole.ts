import mongoose, { Model } from "mongoose";

export interface SuccessRoleDoc {
  role: string;
  role_description?: string;
  required_experience: number;
  required_skills: string[];
  min_performance_rating: number;
  min_potential_rating: number;
  required_scores?: {
    technical: number;
    communication: number;
    leadership: number;
  };
}

const SuccessRoleSchema = new mongoose.Schema<SuccessRoleDoc>({
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

const SuccessRoleModel: Model<SuccessRoleDoc> =
  (mongoose.models["Success_Role"] as Model<SuccessRoleDoc>) ||
  mongoose.model<SuccessRoleDoc>("Success_Role", SuccessRoleSchema);

export default SuccessRoleModel;
