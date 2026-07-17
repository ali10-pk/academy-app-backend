import Student from "../../models/student.model.js";

export const GetAllStudents = async (req, res) => {
  try {
    // 1. Fetch all students from the database
    // .sort({ createdAt: -1 }) ensures newly registered students appear at the top
    const students = await Student.find({}).sort({ createdAt: -1 });

    // 2. Return a successful response even if the list is empty
    return res.status(200).json({
      success: true,
      count: students.length,
      message: students.length > 0 
        ? "Students fetched successfully" 
        : "No student records found in the database.",
      data: students,
    });

  } catch (error) {
    console.error("Get All Students Error:", error);

    // 3. Handle unexpected database or server errors safely
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching student records.",
      error: error.message,
    });
  }
};