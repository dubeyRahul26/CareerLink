import mongoose from "mongoose";

const studentRegistrySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  graduationYear: { type: Number, required: true },
  branch: { 
    type: String, 
    required: true 
  },
  cgpa: { type: Number, min: 0, max: 10 },     
  phone: { type: String },                                       
}, { timestamps: true });

export default mongoose.model("StudentRegistry", studentRegistrySchema);
