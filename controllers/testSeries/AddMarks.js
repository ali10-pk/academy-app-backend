import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const AddMarks = async (req, res) => {
  try {
    const { testName, subject, totalMarks, date, studentMarks } = req.body;

    // 1. Validation
    if (!testName || !subject || totalMarks === undefined || !studentMarks || !Array.isArray(studentMarks)) {
      return res.status(400).json({
        success: false,
        message: "Missing metadata (testName, subject, totalMarks) or student marks array.",
      });
    }

    const parsedTotalMarks = Number(totalMarks);
    const testDate = date ? new Date(date) : new Date();

    const bulkOperations = [];

    for (const record of studentMarks) {
      const { studentId, obtainMarks } = record;

      if (!studentId || obtainMarks === undefined) {
        return res.status(400).json({
          success: false,
          message: "Each entry in studentMarks must contain studentId and obtainMarks.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid student ID format: ${studentId}`,
        });
      }

      const parsedObtainMarks = Number(obtainMarks);

      // Validate marks logic
      if (parsedObtainMarks > parsedTotalMarks) {
        return res.status(400).json({
          success: false,
          message: `Obtained marks (${parsedObtainMarks}) cannot exceed total marks (${parsedTotalMarks}) for student ${studentId}.`,
        });
      }

      // 2. Build Aggregates & Record Logic
      // Check if student already has this exact test name + subject
      const student = await Student.findById(studentId);
      if (!student) continue;

      const existingTestIndex = student.testSeries.findIndex(
        (t) => t.testName === testName && t.subject === subject
      );

      if (existingTestIndex !== -1) {
        // SCENARIO A: Test exists. We adjust the aggregate differences before updating the entry.
        const oldObtained = student.testSeries[existingTestIndex].obtainMarks || 0;
        const oldTotal = student.testSeries[existingTestIndex].totalMarks || 0;

        const diffObtained = parsedObtainMarks - oldObtained;
        const diffTotal = parsedTotalMarks - oldTotal;

        bulkOperations.push({
          updateOne: {
            filter: { 
              _id: studentId, 
              "testSeries.testName": testName, 
              "testSeries.subject": subject 
            },
            update: {
              $set: {
                "testSeries.$.obtainMarks": parsedObtainMarks,
                "testSeries.$.totalMarks": parsedTotalMarks,
                "testSeries.$.date": testDate
              },
              $inc: {
                totalTestObtained: diffObtained,
                totalTestMarks: diffTotal
              }
            }
          }
        });
      } else {
        // SCENARIO B: New test. Append it to the testSeries array and increment aggregate properties.
        const newTest = {
          testName,
          subject,
          obtainMarks: parsedObtainMarks,
          totalMarks: parsedTotalMarks,
          date: testDate
        };

        bulkOperations.push({
          updateOne: {
            filter: { _id: studentId },
            update: {
              $push: { testSeries: newTest },
              $inc: {
                totalTestObtained: parsedObtainMarks,
                totalTestMarks: parsedTotalMarks
              }
            }
          }
        });
      }
    }

    // 3. Execute bulk batch operations to DB
    if (bulkOperations.length > 0) {
      await Student.bulkWrite(bulkOperations, { ordered: true });
    }

    return res.status(200).json({
      success: true,
      message: `Marks for '${testName} - ${subject}' have been recorded successfully.`,
    });

  } catch (error) {
    console.error("Add Marks Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while uploading academic test marks.",
      error: error.message,
    });
  }
};