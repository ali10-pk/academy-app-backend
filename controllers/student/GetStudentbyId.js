import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const GetStudentByID = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format.",
      });
    }

    // 2. Fetch the student document from the database
    const student = await Student.findById(id);

    // 3. Handle cases where the student record doesn't exist
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with ID: ${id}`,
      });
    }

    // 4. Return the student details
    return res.status(200).json({
      success: true,
      message: "Student record retrieved successfully.",
      data: student,
    });

  } catch (error) {
    console.error("Get Student By ID Error:", error);

    // 5. Safely handle unexpected server or database errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the student record.",
      error: error.message,
    });
  }
};