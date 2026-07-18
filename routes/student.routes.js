import express from "express";
import { AddNewStudent } from "../controllers/student/AddNewStudent.js";
import { GetAllStudents } from "../controllers/student/GetAllStudents.js";
import { GetStudentByID } from "../controllers/student/GetStudentbyId.js";
import { UpdateStudentRecord } from "../controllers/student/UpdateStudent.js";
import { DeleteStudent } from "../controllers/student/DeleteStudent.js";
import { MarkAttendance } from "../controllers/attendance/MarkAttendance.js";
import { GetAttendance } from "../controllers/attendance/GetAttendance.js";
import { CollectFee } from "../controllers/fee/CollectFee.js";
import { GetFee } from "../controllers/fee/GetFee.js";
import { AddMarks } from "../controllers/testSeries/AddMarks.js";
import { GetMarks } from "../controllers/testSeries/GetMarks.js";
import { UpdateMarks } from "../controllers/testSeries/UpdateMarks.js";
import { Dashboard } from "../controllers/student/Dashboard.js";
import { GetStudentByAdmissionNo } from "../controllers/student/SearchStudent.js";
import { ClearAttendanceRecords } from "../controllers/attendance/DeleteAttendance.js";

const router = express.Router();

router.post("/addnew", AddNewStudent);
router.get("/all", GetAllStudents);
router.get("/:id", GetStudentByID);
router.get("/search/:admissionNo", GetStudentByAdmissionNo);
router.put("/update/:id", UpdateStudentRecord);
router.delete("/delete/:id", DeleteStudent);
router.post("/attendance", MarkAttendance);
router.get("/attendance/all", GetAttendance);
router.post("/attendance/clear", ClearAttendanceRecords)
router.post("/fee", CollectFee);
router.get("/fee/all", GetFee);
router.get("/dashboard/all", Dashboard)
router.post("/marks", AddMarks);
router.get("/marks/all", GetMarks);
router.put("/update-marks/", UpdateMarks);


export default router;