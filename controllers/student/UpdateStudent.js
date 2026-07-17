import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const UpdateStudentRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format.",
      });
    }

    // 2. Fetch the student document first to check if they exist
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with ID: ${id}`,
      });
    }

    const updateData = { ...req.body };

    // 3. Prevent duplicate admission numbers if the admission number is being changed
    if (updateData.admissionNo && updateData.admissionNo.trim() !== student.admissionNo) {
      const duplicateCheck = await Student.findOne({ 
        admissionNo: updateData.admissionNo.trim() 
      });
      if (duplicateCheck) {
        return res.status(400).json({
          success: false,
          message: `Admission No '${updateData.admissionNo}' is already taken by another student.`,
        });
      }
      updateData.admissionNo = updateData.admissionNo.trim();
    }

    // 4. Validate Enum values if they are being updated
    const allowedClasses = ["9th Class", "10th Class", "11th Class", "12th Class"];
    if (updateData.className && !allowedClasses.includes(updateData.className)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class selection. Must be 9th, 10th, 11th, or 12th Class.",
      });
    }

    if (updateData.gender && !["Male", "Female"].includes(updateData.gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be either 'Male' or 'Female'.",
      });
    }

    if (updateData.status && !["Active", "Inactive", "Left"].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Active', 'Inactive', or 'Left'.",
      });
    }

    // 5. Automatically recalculate test aggregates if testSeries is updated
    if (updateData.testSeries && Array.isArray(updateData.testSeries)) {
      let totalTestObtained = 0;
      let totalTestMarks = 0;

      updateData.testSeries.forEach((test) => {
        if (test.obtainMarks && test.totalMarks) {
          totalTestObtained += Number(test.obtainMarks);
          totalTestMarks += Number(test.totalMarks);
        }
      });

      updateData.totalTestObtained = totalTestObtained;
      updateData.totalTestMarks = totalTestMarks;
    }

    // 6. Perform the database update
    // { new: true } returns the modified document instead of the original
    // { runValidators: true } ensures the updates comply with your schema constraints
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Student record updated successfully 🎉",
      data: updatedStudent,
    });

  } catch (error) {
    console.error("Update Student Error:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the student record.",
      error: error.message,
    });
  }
};