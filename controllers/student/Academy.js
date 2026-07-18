import Student from "../models/student.js";

export const GetLeftStudents = async (req, res) => {
  try {
    const students = await Student.find(
      { status: "Left" },
      "-attendance -testSeries"
    ).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};