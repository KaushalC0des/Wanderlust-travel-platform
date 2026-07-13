const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../model/booking.js");   // your folder is model/ not models/
const { isLoggedIn } = require("../middleware.js");



// Create Order
router.post("/create-order", isLoggedIn, async (req, res) => {
  const { amount } = req.body;
  const razorpay = new Razorpay({         
    key_id: process.env.RAZORPAY_KEY_id,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
 try {
    const order = await razorpay.orders.create({
      amount: amount * 100,           // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify Payment + Save Booking
router.post("/verify-payment", isLoggedIn, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    listingId,
    listingTitle,
    customerName,
    customerEmail,
    amount,
  } = req.body;

  // Signature check — prevents fake/tampered payments
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await Booking.create({
      listing: listingId,
      listingTitle,
      customer: req.user._id,          // from passport session, safe
      customerName,
      customerEmail,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    res.json({ success: true, message: "Booking confirmed!" });
  } else {
    res.status(400).json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;