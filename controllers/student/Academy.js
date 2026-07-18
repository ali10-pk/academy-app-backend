import Student from "../models/student.js";

export const GetLeftStudents = async (req, res) => {
  try {
    // Permanently remove attendance and testSeries
    await Student.updateMany(
      { status: "Left" },
      {
        $unset: {
          attendance: "",
          testSeries: "",
        },
      }
    );

    // Fetch updated students
    const students = await Student.find({ status: "Left" }).sort({
      updatedAt: -1,
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No left students found.",
      });
    }

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("GetLeftStudents Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};