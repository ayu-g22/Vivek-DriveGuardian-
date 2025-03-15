const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const registerUser = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      isVehicleRegistered,
      vehicleNumber,
      dlNumber,
    } = req.body;

    const userAvailable = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (userAvailable) {
      return res.status(400).json({ msg: "User Already Available" });
    }

    // Hash Password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      isVehicleRegistered,
      vehicleNumber,
      dlNumber,
    });

    if (user) {
      res.status(201).json({ msg: "User created Successfully", ok: true });
    } else {
      res.status(400).json({ msg: "Failed to create a new User" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  console.log("asdsdfsf");
  try {
    const { phoneNumber, otpOrPassword } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res
        .status(400)
        .json({ msg: "User Not Registered", newUser: true });
    }

    // Compare the password with the user password in the database
    const pass = otpOrPassword;
    if (user && (await bcrypt.compare(pass, user.password))) {
      // Generate a unique token
      const token = jwt.sign(
        { id: user._id, phoneNumber: user.phoneNumber },
        "SIH_Winner",
        {
          expiresIn: "10h", // Token will expire in 1 hour
        }
      );

      res.status(200).json({ ok: true, userId: user._id, token: token });
    } else {
      res.status(401).json({ msg: "Phone Number or Password incorrect" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
});

const getDrivers = asyncHandler(async (req, res) => {
  try {
    const userId = req.body.uid;

    // Find the user by ID and populate the members field
    const user = await User.findOne({ _id: userId }).populate(
      "members",
      "-password"
    );
    if (!user) {
      return res.status(400).json({ msg: "User Not Found" });
    }

    // Send the populated members data
    res.status(200).json({
      ok: true,
      msg: "Members Fetched Successfully",
      data: user.members,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
});

const addDrivers = asyncHandler(async (req, res) => {
  try {
    const { uid, phoneNumber } = req.body;

    // Find users by phone numbers
    const users = await User.find({ phoneNumber: { $in: phoneNumber } });

    // Extract the IDs of the users found
    const memberObjectIds = users.map((user) => user._id.toString());

    // Find the target user
    const targetUser = await User.findById(uid);

    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Convert existing member IDs to string for comparison
    const existingMemberIds = targetUser.members.map((member) =>
      member.toString()
    );

    // Check for existing members
    const alreadyExists = memberObjectIds.filter((id) =>
      existingMemberIds.includes(id)
    );

    if (alreadyExists.length > 0) {
      return res.status(400).json({ msg: "Member Already Exists" });
    }

    // Update the members array if no duplicates are found
    targetUser.members = [
      ...targetUser.members,
      ...memberObjectIds.map((id) => new mongoose.Types.ObjectId(id)),
    ];
    await targetUser.save();

    res
      .status(200)
      .json({ msg: "Members added successfully", data: targetUser.members });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
});

const deleteDriver = asyncHandler(async (req, res) => {
  const memId = req.query.memId;
  const userId = req.body.userId;

  if (!memId) {
    return res.status(400).json({ message: "Missing Member Id." });
  }
  if (!userId) {
    return res.status(400).json({ message: "Missing User Id." });
  }

  try {
    // Update the user's record to pull the member ID from the members array
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { members: memId } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User or member not found." });
    }

    res.status(200).json({ message: "Member removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server Error.", error: error.message });
  }
});

module.exports = {
  registerUser,
  loginUser,
  getDrivers,
  addDrivers,
  deleteDriver,
};
