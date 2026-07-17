import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const GetAttendance = async (req, res) => {
  try {
    const { date, className, section, studentId } = req.query;

    // ==========================================
    // SCENARIO 1: Fetch attendance for a single student
    // ==========================================
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Student ID format.",
        });
      }

      const student = await Student.findById(studentId, {
        name: 1,
        admissionNo: 1,
        className: 1,
        section: 1,
        attendance: 1, // Return full history
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student record not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Student attendance history retrieved.",
        data: student,
      });
    }

    // ==========================================
    // SCENARIO 2: Fetch class sheet for a specific date
    // ==========================================
    if (!date || !className) {
      return res.status(400).json({
        success: false,
        message: "Please provide both 'date' and 'className' query parameters.",
      });
    }

    // Normalize date to Midnight UTC to match database storage format
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Build database filters
    const matchFilters = {
      className,
      status: "Active" // Usually we only track active students
    };
    if (section) {
      matchFilters.section = section;
    }

    // Use a MongoDB aggregation pipeline to fetch students and ONLY 
    // filter down to the selected day's status (saving bandwidth)
    const attendanceSheet = await Student.aggregate([
      { $match: matchFilters },
      {
        $project: {
          _id: 1,
          name: 1,
          admissionNo: 1,
          className: 1,
          section: 1,
          // Extract only the matching date's object from the attendance array
          dayRecord: {
            $filter: {
              input: "$attendance",
              as: "record",
              cond: { $eq: ["$$record.date", targetDate] }
            }
          }
        }
      },
      {
        $project: {
          studentId: "$_id",
          name: 1,
          admissionNo: 1,
          className: 1,
          section: 1,
          // If a record exists return its status, otherwise default to "Not Marked"
          status: {
            $ifNull: [
              { $arrayElemAt: ["$dayRecord.status", 0] },
              "Not Marked"
            ]
          }
        }
      },
      { $sort: { name: 1 } } // Sort alphabetically
    ]);

    return res.status(200).json({
      success: true,
      count: attendanceSheet.length,
      date: targetDate,
      data: attendanceSheet,
    });

  } catch (error) {
    console.error("Get Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching attendance records.",
      error: error.message,
    });
  }
};