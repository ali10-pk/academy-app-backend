import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const GetFee = async (req, res) => {
  try {
    const { month, className, section, studentId } = req.query;

    // ==========================================
    // SCENARIO 1: Get complete fee history of a single student
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
        status: 1,
        fees: 1, // Return array of monthly fee payments
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student record not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Student fee payment history retrieved.",
        data: student,
      });
    }

    // ==========================================
    // SCENARIO 2: Get a class-wide fee ledger for a specific month
    // ==========================================
    if (!month || !className) {
      return res.status(400).json({
        success: false,
        message: "Please provide both 'month' and 'className' query parameters.",
      });
    }

    // Build filters to scope down the target class
    const matchFilters = {
      className,
      status: "Active" // Focus on actively enrolled students
    };
    if (section) {
      matchFilters.section = section;
    }

    // We use Mongoose/MongoDB aggregation to extract details and isolate 
    // ONLY the targeted month's fee details, rather than loading bulk data.
    const feeLedger = await Student.aggregate([
      { $match: matchFilters },
      {
        $project: {
          _id: 1,
          name: 1,
          admissionNo: 1,
          className: 1,
          section: 1,
          // Filter down the array to only match the selected month string (e.g. "July")
          monthRecord: {
            $filter: {
              input: "$fees",
              as: "fee",
              cond: { $eq: ["$$fee.month", month] }
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
          // Deconstruct the filtered monthly record object
          feeDetails: {
            $ifNull: [
              { $arrayElemAt: ["$monthRecord", 0] },
              {
                month: month,
                amount: 0,
                paidAmount: 0,
                remainingAmount: 0,
                status: "Unpaid"
              }
            ]
          }
        }
      },
      { $sort: { name: 1 } } // Keep student layout clean and alphabetical
    ]);

    return res.status(200).json({
      success: true,
      count: feeLedger.length,
      month,
      data: feeLedger,
    });

  } catch (error) {
    console.error("Get Fee Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching fee records.",
      error: error.message,
    });
  }
};