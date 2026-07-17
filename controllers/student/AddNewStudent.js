import Student from "../../models/student.model.js";

export const AddNewStudent = async (req, res) => {
  try {
    const {
      admissionNo,
      name,
      fatherName,
      guardianName,
      BForm,
      fatherCNIC,
      gender,
      DOB,
      phoneNo,
      address,
      className,
      section,
      schoolName,
      session,
      joiningDate,
      boardRollNo,
      boardObtainMarks,
      boardTotalMarks,
      attendance,
      fees,
      testSeries,
      status,
    } = req.body;

    if (!admissionNo || !name || !fatherName || !className || !session) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields: Admission Number, Name, Father's Name, Class, and Session.",
      });
    }

    const allowedClasses = ["9th Class", "10th Class", "11th Class", "12th Class"];
    if (!allowedClasses.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class selection. Must be 9th, 10th, 11th, or 12th Class.",
      });
    }

    if (gender && !["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be either 'Male' or 'Female'.",
      });
    }

    if (status && !["Active", "Inactive", "Left"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Active', 'Inactive', or 'Left'.",
      });
    }

    const existingStudent = await Student.findOne({ admissionNo: admissionNo.trim() });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `A student with Admission No '${admissionNo}' already exists in the records.`,
      });
    }

    let totalTestObtained = 0;
    let totalTestMarks = 0;

    if (testSeries && Array.isArray(testSeries)) {
      testSeries.forEach((test) => {
        if (test.obtainMarks && test.totalMarks) {
          totalTestObtained += Number(test.obtainMarks);
          totalTestMarks += Number(test.totalMarks);
        }
      });
    }

    const newStudent = new Student({
      admissionNo: admissionNo.trim(),
      name: name.trim(),
      fatherName: fatherName.trim(),
      guardianName: guardianName ? guardianName.trim() : "",
      BForm: BForm ? BForm.trim() : "",
      fatherCNIC: fatherCNIC ? fatherCNIC.trim() : "",
      gender: gender || "Male",
      DOB: DOB ? new Date(DOB) : null,
      phoneNo: phoneNo || "",
      address: address || "",
      className,
      section: section || "A",
      schoolName: schoolName || "",
      session,
      joiningDate: joiningDate ? new Date(joiningDate) : Date.now(),
      boardRollNo: boardRollNo || "",
      boardObtainMarks: boardObtainMarks || 0,
      boardTotalMarks: boardTotalMarks || 0,
      attendance: attendance || [],
      fees: fees || [],
      testSeries: testSeries || [],
      totalTestObtained,
      totalTestMarks,
      status: status || "Active",
    });

    const savedStudent = await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student registered successfully 🎉",
      data: savedStudent,
    });

  } catch (error) {
    console.error("Add Student Error:", error);
    
    // Handle database validation or connection errors gracefully
    return res.status(500).json({
      success: false,
      message: "An error occurred while registering the student record.",
      error: error.message,
    });
  }
};