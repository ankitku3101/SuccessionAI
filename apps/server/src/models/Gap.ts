import { Document, model, Schema, Types } from "mongoose";

// Interface for employee information
interface IEmployeeInfo {
    mongo_id: Types.ObjectId;
    role: string;
    experience_years: number;
}

// Interface for target role information
interface ITargetRoleInfo {
    role: string;
    required_experience: number;
}

// Interface for score gap details
interface IScoreGap {
    employee: number;
    required: number;
    status: string;
}

// Interface for rating gap details  
interface IRatingGap {
    employee: number;
    required: number;
    status: string;
}

// Interface for score gaps object
interface IScoreGaps {
    technical: IScoreGap;
    communication: IScoreGap;
    leadership: IScoreGap;
}

// Interface for rating gaps object
interface IRatingGaps {
    performance: IRatingGap;
    potential: IRatingGap;
}

// Interface for gap analysis
interface IGapAnalysis {
    overall_skill_match: string;
    matched_skills: string[];
    missing_skills: string[];
    score_gaps: IScoreGaps;
    rating_gaps: IRatingGaps;
    recommendations: string[];
}

// Main Gap interface
export interface IGap extends Document {
    employee_info: IEmployeeInfo;
    target_role_info: ITargetRoleInfo;
    gap_analysis: IGapAnalysis;
}

// Schema for score gap details
const scoreGapSchema = new Schema({
    employee: {
        type: Number,
        required: true,
        min: [0, 'Employee score cannot be negative'],
        max: [100, 'Employee score cannot exceed 100']
    },
    required: {
        type: Number,
        required: true,
        min: [0, 'Required score cannot be negative'],
        max: [100, 'Required score cannot exceed 100']
    },
    status: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

// Schema for rating gap details
const ratingGapSchema = new Schema({
    employee: {
        type: Number,
        required: true,
        min: [0, 'Employee rating cannot be negative'],
        max: [5, 'Employee rating cannot exceed 5']
    },
    required: {
        type: Number,
        required: true,
        min: [0, 'Required rating cannot be negative'],
        max: [5, 'Required rating cannot exceed 5']
    },
    status: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

// Schema for employee information
const employeeInfoSchema = new Schema({
    mongo_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'EmployeeProfile'
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    experience_years: {
        type: Number,
        required: true,
        min: [0, 'Experience years cannot be negative'],
        max: [100, 'Experience years cannot exceed 100']
    }
}, { _id: false });

// Schema for target role information
const targetRoleInfoSchema = new Schema({
    role: {
        type: String,
        required: true,
        trim: true
    },
    required_experience: {
        type: Number,
        required: true,
        min: [0, 'Required experience cannot be negative'],
        max: [100, 'Required experience cannot exceed 100']
    }
}, { _id: false });

// Schema for gap analysis
const gapAnalysisSchema = new Schema({
    overall_skill_match: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(value: string) {
                // Validate percentage format (e.g., "75%")
                return /^\d{1,3}%$/.test(value);
            },
            message: 'Overall skill match must be in percentage format (e.g., "75%")'
        }
    },
    matched_skills: {
        type: [String],
        default: [],
        validate: {
            validator: function(skills: string[]) {
                return skills.every(skill => skill.trim().length > 0);
            },
            message: 'All matched skills must be non-empty'
        }
    },
    missing_skills: {
        type: [String],
        default: [],
        validate: {
            validator: function(skills: string[]) {
                return skills.every(skill => skill.trim().length > 0);
            },
            message: 'All missing skills must be non-empty'
        }
    },
    score_gaps: {
        technical: {
            type: scoreGapSchema,
            required: true
        },
        communication: {
            type: scoreGapSchema,
            required: true
        },
        leadership: {
            type: scoreGapSchema,
            required: true
        }
    },
    rating_gaps: {
        performance: {
            type: ratingGapSchema,
            required: true
        },
        potential: {
            type: ratingGapSchema,
            required: true
        }
    },
    recommendations: {
        type: [String],
        default: [],
        validate: {
            validator: function(recommendations: string[]) {
                return recommendations.every(rec => rec.trim().length > 0);
            },
            message: 'All recommendations must be non-empty'
        },
        maxlength: [20, 'Cannot have more than 20 recommendations']
    }
}, { _id: false });

// Main Gap schema
const gapSchema = new Schema<IGap>(
    {
        employee_info: {
            type: employeeInfoSchema,
            required: true
        },
        target_role_info: {
            type: targetRoleInfoSchema,
            required: true
        },
        gap_analysis: {
            type: gapAnalysisSchema,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes for better query performance
gapSchema.index({ 'employee_info.mongo_id': 1 });
gapSchema.index({ 'target_role_info.role': 1 });
gapSchema.index({ 'gap_analysis.overall_skill_match': 1 });

const GapModel = model<IGap>('Gap', gapSchema);

export default GapModel;
