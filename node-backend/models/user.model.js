import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    rollNumber: {
      type: String,
      required: function () {
        return this.role === "student";
      },
    },

    company: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "recruiter", "cdc"],
      default: "student",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    resumeLink: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
