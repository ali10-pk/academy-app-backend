import Student from "../../models/student.model.js";

export const GetMarks = async (req, res) => {
  try {
    const { admissionNo, className, section } = req.query;

    // =====================================================
    // Individual Student Result
    // =====================================================
    if (admissionNo) {
      const student = await Student.findOne({
        admissionNo,
        status: "Active",
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      const totalObtained = student.testSeries.reduce(
        (sum, item) => sum + (item.obtainMarks || 0),
        0
      );

      const totalMarks = student.testSeries.reduce(
        (sum, item) => sum + (item.totalMarks || 0),
        0
      );

      const percentage =
        totalMarks > 0
          ? Number(((totalObtained / totalMarks) * 100).toFixed(2))
          : 0;

      return res.status(200).json({
        success: true,
        data: {
          admissionNo: student.admissionNo,
          name: student.name,
          className: student.className,
          section: student.section,
          subjects: student.testSeries,
          totalObtained,
          totalMarks,
          percentage,
        },
      });
    }

    // =====================================================
    // Class Wise Result
    // =====================================================
    if (!className) {
      return res.status(400).json({
        success: false,
        message: "className is required.",
      });
    }

    const query = {
      className,
      status: "Active",
    };

    if (section) {
      query.section = section;
    }

    const students = await Student.find(query).lean();

    const result = students.map((student) => {
      const totalObtained = student.testSeries.reduce(
        (sum, item) => sum + (item.obtainMarks || 0),
        0
      );

      const totalMarks = student.testSeries.reduce(
        (sum, item) => sum + (item.totalMarks || 0),
        0
      );

      const percentage =
        totalMarks > 0
          ? Number(((totalObtained / totalMarks) * 100).toFixed(2))
          : 0;

      return {
        admissionNo: student.admissionNo,
        name: student.name,
        className: student.className,
        section: student.section,
        subjects: student.testSeries,
        totalObtained,
        totalMarks,
        percentage,
      };
    });

    // Sort by percentage (highest first)
    result.sort((a, b) => b.percentage - a.percentage);

    // Assign positions
    result.forEach((student, index) => {
      student.position = index + 1;
    });

    return res.status(200).json({
      success: true,
      className,
      section: section || "All",
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("GetMarks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};