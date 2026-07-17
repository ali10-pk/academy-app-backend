import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const UpdateMarks = async (req, res) => {
  try {
    const { studentId, testName, subject, obtainMarks, totalMarks, date } = req.body;

    // 1. Validation
    if (!studentId || !testName || !subject) {
      return res.status(400).json({
        success: false,
        message: "Please provide studentId, testName, and subject to identify the test record.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format.",
      });
    }

    // 2. Fetch student to verify existence and access pre-update marks
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // 3. Find the specific test within the testSeries array
    const testIndex = student.testSeries.findIndex(
      (test) => test.testName === testName && test.subject === subject
    );

    if (testIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `No test record found matching '${testName}' for '${subject}'.`,
      });
    }

    const existingTest = student.testSeries[testIndex];

    // Determine new values or keep existing ones
    const newObtain = obtainMarks !== undefined ? Number(obtainMarks) : existingTest.obtainMarks;
    const newTotal = totalMarks !== undefined ? Number(totalMarks) : existingTest.totalMarks;

    if (newObtain > newTotal) {
      return res.status(400).json({
        success: false,
        message: `Obtained marks (${newObtain}) cannot exceed total marks (${newTotal}).`,
      });
    }

    // 4. Calculate aggregate differences
    const diffObtained = newObtain - (existingTest.obtainMarks || 0);
    const diffTotal = newTotal - (existingTest.totalMarks || 0);

    // 5. Build dynamic update set
    const updateFields = {
      "testSeries.$.obtainMarks": newObtain,
      "testSeries.$.totalMarks": newTotal,
    };
    if (date) {
      updateFields["testSeries.$.date"] = new Date(date);
    }

    // 6. Persist to Database & Increment overall counters
    const updatedStudent = await Student.findOneAndUpdate(
      { 
        _id: studentId, 
        "testSeries.testName": testName, 
        "testSeries.subject": subject 
      },
      {
        $set: updateFields,
        $inc: {
          totalTestObtained: diffObtained,
          totalTestMarks: diffTotal
        }
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `Marks updated successfully for test: '${testName}' 🎉`,
      data: {
        testSeries: updatedStudent.testSeries,
        totalTestObtained: updatedStudent.totalTestObtained,
        totalTestMarks: updatedStudent.totalTestMarks
      }
    });

  } catch (error) {
    console.error("Update Marks Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the test marks.",
      error: error.message,
    });
  }
};