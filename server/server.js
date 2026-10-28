require("./config/db");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const User = require("./module/User");
const Otp = require("./module/Otp");
const Complaint = require("./module/Complaint");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "civica_secret_key";

app.use("/uploads", express.static("uploads"));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("hello civica");
});

// ===================== EMAIL TRANSPORTER =====================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gopichandmudili2@gmail.com",
        pass: "kyeavnyoiiifofwz",
    },
});

// ===================== AUTH ROUTES =====================

app.post("/send_otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: "Email required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.json({ success: false, message: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    try {
        await transporter.sendMail({
            from: "gopichandmudili2@gmail.com",
            to: email,
            subject: "Civica OTP Verification",
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        });
        return res.json({ success: true, message: "OTP sent successfully" });
    } catch (err) {
        console.error("Error sending email:", err);
        return res.json({ success: false, message: "Email sending failed" });
    }
});

app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email, otp });
    if (!record) return res.json({ success: false, message: "Invalid OTP" });
    await Otp.deleteMany({ email });
    return res.json({ success: true, message: "OTP verified" });
});

app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: "Missing fields" });

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.json({ success: false, message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword });
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1d" });
        return res.json({ success: true, token });
    } catch (err) {
        return res.json({ success: false, message: "Signup failed" });
    }
});

app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: "Missing fields" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid password" });

        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1d" });
        return res.json({ success: true, token });
    } catch {
        return res.json({ success: false, message: "Signin failed" });
    }
});

app.post("/forgot-password-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: "Email required" });

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.json({ success: false, message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email });
        await Otp.create({ email, otp });

        await transporter.sendMail({
            from: "gopichandmudili2@gmail.com",
            to: email,
            subject: "Civica Password Reset OTP",
            text: `Your OTP for resetting the password is ${otp}. It is valid for 5 minutes.`,
        });
        return res.json({ success: true, message: "Reset OTP sent to your email" });
    } catch (err) {
        console.error("Error sending reset OTP:", err);
        return res.json({ success: false, message: "Failed to send reset OTP" });
    }
});

app.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.json({ success: false, message: "Missing fields" });

    try {
        const record = await Otp.findOne({ email, otp });
        if (!record) return res.json({ success: false, message: "Invalid OTP" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email }, { password: hashedPassword });
        await Otp.deleteMany({ email });
        return res.json({ success: true, message: "Password reset successfully" });
    } catch (err) {
        console.error("Error resetting password:", err);
        return res.json({ success: false, message: "Failed to reset password" });
    }
});

// ===================== MULTER SETUP =====================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const email = (req.body.email || "user").replace(/[@.]/g, "_");
        const uniqueName = email + "_" + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    }
});

// ===================== KEYWORD CLASSIFIER =====================

function classifyDepartment(description) {
    const text = description.toLowerCase();

    const keywords = {
        water: [
            "water", "pipe", "flood", "leak", "drainage", "sewage",
            "drain", "overflow", "tap", "supply", "puddle", "waterlogging"
        ],
        electric: [
            "electric", "electricity", "light", "power", "wire", "streetlight",
            "transformer", "outage", "shock", "short circuit", "pole", "voltage"
        ],
        road: [
            "road", "pothole", "crack", "footpath", "pavement", "speed",
            "bump", "divider", "traffic", "bridge", "signal", "street"
        ],
        municipal: [
            "garbage", "waste", "trash", "litter", "dust", "park",
            "tree", "sanitation", "clean", "smell", "animal",
            "stray", "building", "construction", "encroachment"
        ]
    };

    let maxScore = 0;
    let assigned = "municipal";

    for (const [dept, words] of Object.entries(keywords)) {
        const score = words.filter(w => text.includes(w)).length;
        if (score > maxScore) {
            maxScore = score;
            assigned = dept;
        }
    }

    return assigned;
}

// ===================== COMPLAINT ROUTES =====================

app.post("/raise-complaint", upload.single("image"), async (req, res) => {
    try {
        const { email, description, lat, lng, priorityScore } = req.body;

        if (!req.file || !email || !description || !lat || !lng) {
            return res.json({ success: false, message: "Missing fields" });
        }

        // Classify department using keywords (no AI server needed)
        const department = classifyDepartment(description);

        await Complaint.create({
            email,
            imagePath: req.file.path,
            description,
            location: {
                lat: Number(lat),
                lng: Number(lng)
            },
            department,
            priorityScore: Number(priorityScore) || 0
        });

        return res.json({
            success: true,
            message: "Complaint submitted successfully",
            department
        });

    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Server error" });
    }
});

// WATER
app.get("/complaints/water", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "water" }).sort({ createdAt: -1 });
        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

// ROAD
app.get("/complaints/road", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "road" }).sort({ createdAt: -1 });
        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

// ELECTRIC
app.get("/complaints/electric", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "electric" }).sort({ createdAt: -1 });
        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

// MUNICIPAL
app.get("/complaints/municipal", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "municipal" }).sort({ createdAt: -1 });
        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

// UPDATE STATUS
app.post("/update-status", async (req, res) => {
    try {
        const { complaintId, newStatus } = req.body;

        if (!complaintId || !newStatus) {
            return res.json({ success: false, message: "Missing fields" });
        }

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) return res.json({ success: false, message: "Complaint not found" });

        const oldStatus = complaint.status;
        complaint.status = newStatus;
        await complaint.save();

        await transporter.sendMail({
            from: "gopichandmudili2@gmail.com",
            to: complaint.email,
            subject: "Civica Complaint Status Update",
            text: `Hello,\n\nYour complaint status has been updated.\n\nPrevious Status: ${oldStatus}\nNew Status: ${newStatus}\n\nThank you for using Civica.`
        });

        return res.json({ success: true, message: "Status updated and email sent" });

    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Server error" });
    }
});

// COMPLAINT STATS
app.get("/complaint-stats", async (req, res) => {
    try {
        const stats = await Complaint.aggregate([
            {
                $group: {
                    _id: { department: "$department", status: "$status" },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json({ success: true, stats });
    } catch (err) {
        res.json({ success: false, message: "Server error" });
    }
});

// USER COMPLAINTS
app.get("/user-complaints/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const complaints = await Complaint.find({ email }).sort({ createdAt: -1 });
        res.json({ success: true, complaints });
    } catch (err) {
        res.json({ success: false, message: "Server error" });
    }
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
