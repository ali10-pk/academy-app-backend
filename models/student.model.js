import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave"],
      default: "Present",
    },
  },
  { _id: false }
);

const feeSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid"],
      default: "Unpaid",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank", "JazzCash", "EasyPaisa"],
      default: "Cash",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const testSeriesSchema = new mongoose.Schema(
  {
    testName: String,
    subject: String,
    obtainMarks: Number,
    totalMarks: Number,
    date: Date,
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    // Student Information
    admissionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    
    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    guardianName: {
      type: String,
      default: "",
      trim: true,
    },

    BForm: {
      type: String,
      default: "",
      trim: true,
    },

    fatherCNIC: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: "Male",
    },

    DOB: {
      type: Date,
    },

    phoneNo: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    // Academic Information
    className: {
      type: String,
      enum: [
        "9th Class",
        "10th Class",
        "11th Class",
        "12th Class",
      ],
      required: true,
    },

    section: {
      type: String,
      default: "A",
    },

    schoolName: {
      type: String,
      default: "",
    },

    session: {
      type: String,
      required: true,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    // Previous Board Result
    boardRollNo: {
      type: String,
      default: "",
    },

    boardObtainMarks: {
      type: Number,
      default: 0,
    },

    boardTotalMarks: {
      type: Number,
      default: 0,
    },

    // Attendance
    attendance: [attendanceSchema],

    // Fee Collection
    fees: [feeSchema],

    // Test Series
    testSeries: [testSeriesSchema],

    // Current Aggregate
    totalTestObtained: {
      type: Number,
      default: 0,
    },

    totalTestMarks: {
      type: Number,
      default: 0,
    },

    // Student Status
    status: {
      type: String,
      enum: ["Active", "Inactive", "Left"],
      default: "Active",
    },

  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Student ||
  mongoose.model("Student", studentSchema);