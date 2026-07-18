import Student from "../../models/student.model.js";

export const GetStudentByAdmissionNo = async (req, res) => {
  try {
    const { admissionNo } = req.params;

    if (!admissionNo) {
      return res.status(400).json({
        success: false,
        message: "Admission number is required.",
      });
    }

    const student = await Student.findOne({
      admissionNo: admissionNo.trim(),
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with Admission No: ${admissionNo}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student record retrieved successfully.",
      data: student,
    });
  } catch (error) {
    console.error("Get Student By Admission No Error:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the student record.",
      error: error.message,
    });
  }
};