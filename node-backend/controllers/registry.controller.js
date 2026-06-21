// controllers/registryController.js
import StudentRegistry from "../models/studentRegistry.model.js";
import User from "../models/user.model.js";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
import fs from "fs";
import bcrypt from "bcryptjs";

// Bulk upload Excel file
export const uploadRegistry = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Excel file is required",
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({
        error: "No worksheet found in Excel file",
      });
    }

    const headerRow = worksheet.getRow(1);

    const headers = [];

    headerRow.eachCell((cell) => {
      headers.push(String(cell.value).trim());
    });

    const requiredHeaders = [
      "fullName",
      "rollNumber",
      "email",
      "graduationYear",
      "branch",
    ];

    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingHeaders.join(", ")}`,
      });
    }

    const columnMap = {};

    headers.forEach((header, index) => {
      columnMap[header] = index + 1;
    });

    const data = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const fullName = row.getCell(columnMap.fullName).value;

      const rollNumber = row.getCell(columnMap.rollNumber).value;

      const email = row.getCell(columnMap.email).value;

      const graduationYear = row.getCell(columnMap.graduationYear).value;

      const branch = row.getCell(columnMap.branch).value;

      const cgpa = columnMap.cgpa
        ? row.getCell(columnMap.cgpa).value
        : undefined;

      const phone = columnMap.phone
        ? row.getCell(columnMap.phone).value
        : undefined;

      if (!fullName || !rollNumber || !email || !graduationYear || !branch) {
        return;
      }

      data.push({
        fullName: String(fullName).trim(),
        rollNumber: String(rollNumber).trim(),
        email: String(email).trim().toLowerCase(),
        graduationYear,
        branch: String(branch).trim(),
        cgpa: cgpa || undefined,
        phone: phone ? String(phone).trim() : undefined,
      });
    });

    if (data.length === 0) {
      return res.status(400).json({
        error: "No valid student records found",
      });
    }

    await StudentRegistry.insertMany(data, {
      ordered: false,
    });

    res.status(201).json({
      message: "Student registry uploaded successfully",
      count: data.length,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Add single student
export const addStudent = async (req, res) => {
  try {
    let { fullName, email, rollNumber, graduationYear, branch, cgpa, phone } =
      req.body;

    if (!fullName || !email || !rollNumber || !graduationYear || !branch) {
      return res.status(400).json({
        error: "Required fields are missing",
      });
    }

    email = email.trim().toLowerCase();

    const exists = await StudentRegistry.findOne({
      $or: [{ email }, { rollNumber }],
    });

    if (exists) {
      return res.status(409).json({
        error: "Student already exists",
      });
    }

    const student = await StudentRegistry.create({
      fullName,
      email,
      rollNumber,
      graduationYear,
      branch,
      cgpa,
      phone,
    });

    res.status(201).json({
      message: "Student added successfully",
      student,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid student ID",
      });
    }

    const allowedUpdates = {
      fullName: req.body.fullName,
      email: req.body.email?.trim().toLowerCase(),
      rollNumber: req.body.rollNumber,
      graduationYear: req.body.graduationYear,
      branch: req.body.branch,
      cgpa: req.body.cgpa,
      phone: req.body.phone,
    };

    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const student = await StudentRegistry.findByIdAndUpdate(
      id,
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    res.json({
      message: "Student updated successfully",
      student,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid student ID",
      });
    }

    const student = await StudentRegistry.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    res.json({
      message: "Student deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const createRecruiter = async (req, res) => {
  try {
    let { name, email, company, password } = req.body;

    if (!name || !email || !company || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    email = email.trim().toLowerCase();

    const existingRecruiter = await User.findOne({
      email,
    });

    if (existingRecruiter) {
      return res.status(409).json({
        error: "Recruiter already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const recruiter = await User.create({
      name: name.trim(),
      email,
      company: company.trim(),
      password: hashedPassword,
      role: "recruiter",
      isVerified: true,
    });

    res.status(201).json({
      message: "Recruiter created successfully",
      recruiter: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        company: recruiter.company,
        role: recruiter.role,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await StudentRegistry.find();

    res.json(students);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};


export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid student ID",
      });
    }

    const student = await StudentRegistry.findById(id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    res.json(student);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};