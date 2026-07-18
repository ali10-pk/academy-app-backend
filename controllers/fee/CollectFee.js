import Student from "../../models/student.model.js";

export const CollectFee = async (req, res) => {
  try {
    const { admissionNo, month, amount, paidAmount, paymentMethod, remarks } = req.body;

    // 1. Basic validation
    if (!admissionNo || !month || amount === undefined || paidAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields: admissionNo, month, total amount, and paidAmount.",
      });
    }

    // Validate enum fields matching the schema setup
    const allowedMethods = ["Cash", "Bank", "JazzCash", "EasyPaisa"];
    if (paymentMethod && !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Choose from Cash, Bank, JazzCash, or EasyPaisa.",
      });
    }

    // 2. Perform the calculation math
    const totalAmount = Number(amount);
    const totalPaid = Number(paidAmount);
    const remainingAmount = Math.max(0, totalAmount - totalPaid);
    
    let currentStatus = "Unpaid";
    if (totalPaid >= totalAmount) {
      currentStatus = "Paid";
    } else if (totalPaid > 0) {
      currentStatus = "Partial";
    }

    // 3. Prepare the update data payload
    const feeData = {
      month,
      amount: totalAmount,
      paidAmount: totalPaid,
      remainingAmount,
      status: currentStatus,
      paymentDate: totalPaid > 0 ? new Date() : null,
      paymentMethod: paymentMethod || "Cash",
      remarks: remarks || "",
    };

    // 4. Try updating an existing entry for that month using admissionNo
    let updatedStudent = await Student.findOneAndUpdate(
      { admissionNo: admissionNo, "fees.month": month },
      { 
        $set: { 
          "fees.$[elem]": feeData 
        } 
      },
      { 
        arrayFilters: [{ "elem.month": month }],
        new: true,
        runValidators: true 
      }
    );

    // 5. If it wasn't matched/updated, push a fresh month object under the student matching admissionNo
    if (!updatedStudent) {
      updatedStudent = await Student.findOneAndUpdate(
        { admissionNo: admissionNo },
        { 
          $push: { fees: feeData } 
        },
        { new: true, runValidators: true }
      );
    }

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student record not found with the provided Admission Number.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Fee record updated successfully for ${month} 🎉`,
      data: updatedStudent.fees,
    });

  } catch (error) {
    console.error("Collect Fee Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while tracking this fee transaction.",
      error: error.message,
    });
  }
};