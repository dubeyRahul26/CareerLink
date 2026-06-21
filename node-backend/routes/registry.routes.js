import express from "express";
import multer from "multer";

import {
  uploadRegistry,
  addStudent,
  updateStudent,
  deleteStudent,
  createRecruiter,
  getStudents,
  getStudentById,
} from "../controllers/registry.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
});

// CDC-only routes
router.post("/upload",authMiddleware(["cdc"]),upload.single("file"),uploadRegistry);
router.post("/add", authMiddleware(["cdc"]), addStudent);
router.put("/:id", authMiddleware(["cdc"]), updateStudent);
router.delete("/:id", authMiddleware(["cdc"]), deleteStudent);
router.post("/recruiters",authMiddleware(["cdc"]),createRecruiter);
router.get("/students",authMiddleware(["cdc"]),getStudents);
router.get("/students/:id",authMiddleware(["cdc"]),getStudentById);

export default router;
