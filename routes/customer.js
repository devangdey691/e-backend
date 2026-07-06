const express = require("express");
const router = express.Router();
const Customer = require('../models/customer');
const { sendContactConfirmationEmail, sendContactFormSubmissionEmail, sendLoginEmail } = require('../utils/sendEmail');


router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newInquiry = new Customer({
      name,
      email,
      subject,
      message,
      createdAt: new Date()
    });

    await newInquiry.save();

    // Send confirmation and admin alert emails asynchronously
    sendContactConfirmationEmail(newInquiry).catch(err => console.error("Error sending contact confirmation email:", err));
    sendContactFormSubmissionEmail(newInquiry).catch(err => console.error("Error sending admin contact alert email:", err));

    res.status(201).json({ message: "Inquiry saved successfully!", customer: newInquiry });
  } catch (error) {
    console.error("Backend Error saving inquiry:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    console.error("Backend Error fetching inquiries:", error);
    res.status(500).json({ message: "Error retrieving entries." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    res.status(200).json({ message: "Inquiry deleted successfully!" });
  } catch (error) {
    console.error("Backend Error deleting inquiry:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message,
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      // Send login email asynchronously
      sendLoginEmail(user).catch(err => console.error("Error sending login email:", err));

      return res.json({
        success: true,
        user,
      });
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

module.exports = router;