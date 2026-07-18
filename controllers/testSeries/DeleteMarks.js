import Student from "../../models/student.model.js";

export const DeleteMarks = async (req, res) => {
  try {
    const {
      admissionNo,
      className,
      section,
      subject,
      testName,
    } = req.body;

    // =====================================
    // Delete Marks of One Student
    // =====================================
    if (admissionNo) {
      const student = await Student.findOne({
        admissionNo,
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      student.testSeries = student.testSeries.filter(
        (test) =>
          !(
            test.subject === subject &&
            test.testName === testName
          )
      );

      // Recalculate totals
      student.totalTestObtained = student.testSeries.reduce(
        (sum, test) => sum + (test.obtainMarks || 0),
        0
      );

      student.totalTestMarks = student.testSeries.reduce(
        (sum, test) => sum + (test.totalMarks || 0),
        0
      );

      await student.save();

      return res.status(200).json({
        success: true,
        message: "Marks deleted successfully.",
      });
    }

    // =====================================
    // Delete Marks of Whole Class
    // =====================================
    if (!className || !subject || !testName) {
      return res.status(400).json({
        success: false,
        message:
          "className, subject and testName are required.",
      });
    }

    const query = {
      className,
      status: "Active",
    };

    if (section) {
      query.section = section;
    }

    const students = await Student.find(query);

    for (const student of students) {
      student.testSeries = student.testSeries.filter(
        (test) =>
          !(
            test.subject === subject &&
            test.testName === testName
          )
      );

      student.totalTestObtained = student.testSeries.reduce(
        (sum, test) => sum + (test.obtainMarks || 0),
        0
      );

      student.totalTestMarks = student.testSeries.reduce(
        (sum, test) => sum + (test.totalMarks || 0),
        0
      );

      await student.save();
    }

    return res.status(200).json({
      success: true,
      message: `Marks deleted from ${students.length} students.`,
    });
  } catch (error) {
    console.error("Delete Marks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};