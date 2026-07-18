import mongoose from "mongoose";
import Student from "../../models/student.model.js";

// Backend Controller: Delete/Reset attendance logs
export const ClearAttendanceRecords = async (req, res) => {
  try {
    const { studentId, date, className, section } = req.body;

    // SCENARIO 1: Purge the entire lifetime attendance array for a single student
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: "Invalid student identifier." });
      }

      await Student.findByIdAndUpdate(studentId, { $set: { attendance: [] } });

      return res.status(200).json({
        success: true,
        message: "Lifetime historical log cleared successfully for this student.",
      });
    }

    // SCENARIO 2: Wipe records for an entire class on a specific date
    if (!date || !className) {
      return res.status(400).json({
        success: false,
        message: "Please specify both 'date' and 'className' to remove target entries.",
      });
    }

    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const matchQuery = { className };
    if (section) matchQuery.section = section;

    // Pull out any object inside the attendance array matching the specified date
    await Student.updateMany(matchQuery, {
      $pull: { attendance: { date: targetDate } },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted attendance log for ${className} on this date.`,
    });
  } catch (error) {
    console.error("Clear Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server structural failure handling deletion sequence.",
      error: error.message,
    });
  }
};