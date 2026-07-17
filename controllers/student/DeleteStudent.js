import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const DeleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format.",
      });
    }

    // 2. Find the student and delete them from the database
    // findByIdAndDelete automatically cleans up the document
    const deletedStudent = await Student.findByIdAndDelete(id);

    // 3. Handle cases where the student record was not found
    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: `No student found with ID: ${id}`,
      });
    }

    // 4. Return success response with details of deleted record
    return res.status(200).json({
      success: true,
      message: `Student '${deletedStudent.name}' has been successfully deleted.`,
    });

  } catch (error) {
    console.error("Delete Student Error:", error);

    // 5. Safely handle unexpected server or database errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while attempting to delete the student.",
      error: error.message,
    });
  }
};