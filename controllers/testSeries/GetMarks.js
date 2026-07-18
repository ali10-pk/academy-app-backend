export const GetMarks = async (req, res) => {
  try {
    // Look for 'admissionNo' in query instead of 'studentId'
    const { admissionNo, className, section, subject, testName } = req.query;

    // ==========================================
    // SCENARIO 1: Individual Student Marksheet
    // ==========================================
    if (admissionNo) {
      // Find student by admissionNo
      const student = await Student.findOne({ admissionNo }, {
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
          message: "Student with this Admission No. not found.",
        });
      }

      const percentage = student.totalTestMarks > 0 
        ? ((student.totalTestObtained / student.totalTestMarks) * 100).toFixed(2) 
        : "0.00";

      return res.status(200).json({
        success: true,
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
    // SCENARIO 2: Class Test Ledger
    // ==========================================
    if (!className || !subject) {
      return res.status(400).json({
        success: false,
        message: "Please specify 'className' and 'subject' or provide an 'admissionNo'.",
      });
    }

    // Aggregation pipeline remains same but ensures it returns admissionNo
    const classLedger = await Student.aggregate([
      { $match: { className, status: "Active", ...(section && { section }) } },
      {
        $project: {
          name: 1,
          admissionNo: 1, // Keep this as the primary identifier
          section: 1,
          testResults: {
            $filter: {
              input: "$testSeries",
              as: "test",
              cond: {
                $and: [
                  { $eq: ["$$test.subject", subject] },
                  testName ? { $eq: ["$$test.testName", testName] } : { $literal: true }
                ]
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      count: classLedger.length,
      data: classLedger,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};