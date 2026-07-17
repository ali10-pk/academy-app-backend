import mongoose from "mongoose";
import Student from "../../models/student.model.js";

export const Dashboard = async (req, res) => {
  try {
    // 1. Get today's normalized date (Midnight UTC) for the attendance calculation
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 2. Fetch basic enrollment counts using MongoDB's aggregation pipeline
    const generalStats = await Student.aggregate([
      {
        $facet: {
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          genderCounts: [
            { $group: { _id: "$gender", count: { $sum: 1 } } }
          ],
          classCounts: [
            { $group: { _id: "$className", count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    // 3. Calculate Financial Summary (Expected vs. Collected vs. Dues)
    const financialStats = await Student.aggregate([
      { $unwind: "$fees" },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$fees.amount" },
          totalCollected: { $sum: "$fees.paidAmount" },
          totalRemaining: { $sum: "$fees.remainingAmount" }
        }
      }
    ]);

    // 4. Calculate Attendance status metrics for today
    const attendanceStats = await Student.aggregate([
      { $unwind: "$attendance" },
      { $match: { "attendance.date": today } },
      {
        $group: {
          _id: "$attendance.status",
          count: { $sum: 1 }
        }
      }
    ]);

    // =========================================================
    // Format the raw Mongo outputs into a clean JSON structure
    // =========================================================

    // Convert arrays of {_id, count} to key-value objects
    const status = {};
    let totalStudents = 0;
    generalStats[0].statusCounts.forEach(item => {
      status[item._id] = item.count;
      totalStudents += item.count;
    });

    const gender = {};
    generalStats[0].genderCounts.forEach(item => {
      gender[item._id] = item.count;
    });

    const classes = {};
    generalStats[0].classCounts.forEach(item => {
      classes[item._id] = item.count;
    });

    const financial = financialStats[0] || { totalExpected: 0, totalCollected: 0, totalRemaining: 0 };
    
    const attendance = { Present: 0, Absent: 0, Leave: 0, NotMarked: 0 };
    let markedCount = 0;
    attendanceStats.forEach(item => {
      if (attendance.hasOwnProperty(item._id)) {
        attendance[item._id] = item.count;
        markedCount += item.count;
      }
    });
    
    // Any active student whose attendance is not recorded yet falls under "Not Marked"
    const activeCount = status["Active"] || 0;
    attendance.NotMarked = Math.max(0, activeCount - markedCount);

    // 5. Send Response
    return res.status(200).json({
      success: true,
      message: "Dashboard analytics loaded successfully.",
      data: {
        enrollment: {
          total: totalStudents,
          active: activeCount,
          inactive: status["Inactive"] || 0,
          left: status["Left"] || 0,
        },
        genderDistribution: {
          male: gender["Male"] || 0,
          female: gender["Female"] || 0
        },
        classDistribution: {
          "9th Class": classes["9th Class"] || 0,
          "10th Class": classes["10th Class"] || 0,
          "11th Class": classes["11th Class"] || 0,
          "12th Class": classes["12th Class"] || 0
        },
        financialSummary: {
          totalExpected: financial.totalExpected,
          totalCollected: financial.totalCollected,
          totalRemaining: financial.totalRemaining,
          collectionRate: financial.totalExpected > 0 
            ? `${((financial.totalCollected / financial.totalExpected) * 100).toFixed(1)}%` 
            : "0%"
        },
        todayAttendance: {
          date: today,
          present: attendance.Present,
          absent: attendance.Absent,
          leave: attendance.Leave,
          notMarked: attendance.NotMarked
        }
      }
    });

  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while compiling dashboard metrics.",
      error: error.message,
    });
  }
};