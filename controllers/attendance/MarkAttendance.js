import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const MarkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    // 1. Validation
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request payload. Please provide an array of attendance records under 'attendanceRecords'.",
      });
    }

    const bulkOperations = [];

    for (const record of attendanceRecords) {
      const { studentId, status, date } = record;

      // Validate required single record properties
      if (!studentId || !status || !date) {
        return res.status(400).json({
          success: false,
          message: "Each record must contain 'studentId', 'status', and 'date'.",
        });
      }

      // Validate studentId format
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid student ID format: ${studentId}`,
        });
      }

      // Validate allowed status types
      if (!["Present", "Absent", "Leave"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status '${status}' for student ${studentId}. Must be 'Present', 'Absent', or 'Leave'.`,
        });
      }

      // Normalize date to start of the day (Midnight UTC) so we can match and prevent duplicate entries
      const attendanceDate = new Date(date);
      attendanceDate.setUTCHours(0, 0, 0, 0);

      // 2. Prepare Bulk Write Operations
      // This operation does two things dynamically:
      // - If attendance for this date exists, it updates the status.
      // - If it doesn't exist, it pushes a new attendance object into the array.
      
      // Step A: Attempt to update an existing entry for that date
      bulkOperations.push({
        updateOne: {
          filter: { 
            _id: studentId, 
            "attendance.date": attendanceDate 
          },
          update: { 
            $set: { "attendance.$.status": status } 
          }
        }
      });

      // Step B: If update didn't match (meaning no entry exists), push a new record.
      // Note: We use filter with $ne to ensure we only run this if the date wasn't already updated.
      bulkOperations.push({
        updateOne: {
          filter: { 
            _id: studentId, 
            "attendance.date": { $ne: attendanceDate } 
          },
          update: { 
            $push: { 
              attendance: { 
                date: attendanceDate, 
                status: status 
              } 
            } 
          }
        }
      });
    }

    // 3. Execute Bulk Write
    // ordered: true preserves the order so the update runs before the push check
    await Student.bulkWrite(bulkOperations, { ordered: true });

    return res.status(200).json({
      success: true,
      message: "Attendance records processed successfully 🎉",
    });

  } catch (error) {
    console.error("Mark Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while saving attendance.",
      error: error.message,
    });
  }
};