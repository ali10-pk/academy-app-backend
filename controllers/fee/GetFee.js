import Student from "../../models/student.model.js";

export const GetFee = async (req, res) => {
  try {
    const { month, className, section, admissionNo } = req.query;

    // ========================================================
    // SCENARIO 1: Get complete fee history of a single student
    // ========================================================
    if (admissionNo) {
      const student = await Student.findOne(
        { admissionNo: admissionNo.trim() },
        {
          name: 1,
          admissionNo: 1,
          className: 1,
          section: 1,
          status: 1,
          fees: 1, // Return array of all historical monthly objects
        }
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student record not found with the provided Admission Number.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Student fee payment history retrieved successfully.",
        data: student,
      });
    }

    // ========================================================
    // SCENARIO 2: Get a class-wide fee ledger for a specific month
    // ========================================================
    if (!month || !className) {
      return res.status(400).json({
        success: false,
        message: "Please provide both 'month' and 'className' query variables.",
      });
    }

    // Build structural filters to query the target group
    const matchFilters = {
      className,
      status: "Active" // Focus exclusively on active registrations
    };
    if (section) {
      matchFilters.section = section;
    }

    // Isolate only the targeted month's fee sub-document state
    const feeLedger = await Student.aggregate([
      { $match: matchFilters },
      {
        $project: {
          _id: 1,
          name: 1,
          admissionNo: 1,
          className: 1,
          section: 1,
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
          _id: 1,
          name: 1,
          admissionNo: 1,
          className: 1,
          section: 1,
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
      { $sort: { name: 1 } } // Maintain perfectly alphabetical student rows
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