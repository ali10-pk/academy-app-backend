import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const GetMarks = async (req, res) => {
  try {
    const { studentId, className, section, subject, testName } = req.query;

    // ==========================================
    // SCENARIO 1: Individual Student Marksheet
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
        testSeries: 1,
        totalTestObtained: 1,
        totalTestMarks: 1,
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student record not found.",
        });
      }

      // Calculate aggregate percentage
      const percentage = student.totalTestMarks > 0 
        ? ((student.totalTestObtained / student.totalTestMarks) * 100).toFixed(2) 
        : "0.00";

      return res.status(200).json({
        success: true,
        message: "Student academic progress retrieved.",
        data: {
          student,
          summary: {
            totalObtained: student.totalTestObtained,
            totalPossible: student.totalTestMarks,
            aggregatePercentage: `${percentage}%`
          }
        }
      });
    }

    // ==========================================
    // SCENARIO 2: Class Test Ledger / Subject Sheet
    // ==========================================
    if (!className || !subject) {
      return res.status(400).json({
        success: false,
        message: "Please specify 'className' and 'subject' or provide a 'studentId'.",
      });
    }

    // Setup filtering query
    const matchFilters = {
      className,
      status: "Active"
    };

    if (section) {
      matchFilters.section = section;
    }

    // Isolate only the specified test/subject data using Mongoose Aggregation
    const classLedger = await Student.aggregate([
      { $match: matchFilters },
      {
        $project: {
          _id: 1,
          name: 1,
          admissionNo: 1,
          section: 1,
          // Extract matching tests from the array
          filteredTests: {
            $filter: {
              input: "$testSeries",
              as: "test",
              cond: {
                $and: [
                  { $eq: ["$$test.subject", subject] },
                  // If testName is provided, match that specifically. Otherwise, return all tests of this subject.
                  testName ? { $eq: ["$$test.testName", testName] } : { $literal: true }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          studentId: "$_id",
          name: 1,
          admissionNo: 1,
          section: 1,
          testResults: "$filteredTests"
        }
      },
      { $sort: { name: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      count: classLedger.length,
      className,
      subject,
      testName: testName || "All Tests",
      data: classLedger,
    });

  } catch (error) {
    console.error("Get Marks Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving marks data.",
      error: error.message,
    });
  }
};