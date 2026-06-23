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
const JWT_SECRET = "civica_secret_key";

app.use("/uploads", express.static("uploads"));


app.use(cors());
app.use(express.json()); // ⭐ IMPORTANT

app.get("/", (req, res) => {
    res.send("hello civica");
});


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gopichandmudili2@gmail.com",     // ✅ Replace with your Gmail address
        pass: "kyea nvyo iiif ofwz".replace(/\s+/g, ""), // ✅ App password (no spaces)
    },
});

app.post("/send_otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: "Email required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.json({ success: false, message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    const mailOptions = {
        from: "sachithbalaka@gmail.com",
        to: email,
        subject: "Civica OTP Verification",
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: "OTP sent successfully" });
    } catch (err) {
        console.error("Error sending email:", err);
        return res.json({ success: false, message: "Email sending failed" });
    }
});
app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email, otp });
    if (!record) {
        return res.json({ success: false, message: "Invalid OTP" });
    }

    await Otp.deleteMany({ email });

    return res.json({ success: true, message: "OTP verified" });
});
app.post("/signup", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Missing fields" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashedPassword
        });

        // 🔐 Generate JWT
        const token = jwt.sign(
            { email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({
            success: true,
            token
        });

    } catch (err) {
        return res.json({ success: false, message: "Signup failed" });
    }
});
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Missing fields" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" });
        }

        // 🔐 Generate JWT
        const token = jwt.sign(
            { email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.json({
            success: true,
            token
        });

    } catch {
        return res.json({ success: false, message: "Signin failed" });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const email = req.body.email.replace(/[@.]/g, "_");
        const uniqueName =
            email + "_" + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    }
});
const axios = require("axios");

app.post("/raise-complaint", upload.single("image"), async (req, res) => {
    try {

        const { email, description, lat, lng, priorityScore } = req.body;

        if (!req.file || !email || !description || !lat || !lng) {
            return res.json({
                success: false,
                message: "Missing fields"
            });
        }

        // Get absolute image path for Python model
        const imagePath = path.resolve(req.file.path);

        // Call FastAPI AI server
        const aiResponse = await axios.post(
            "http://127.0.0.1:8000/predict",
            { image_path: imagePath }
        );

        const department = aiResponse.data.department;

        // Save complaint
        const complaint = await Complaint.create({
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

        return res.json({
            success: false,
            message: "Server error"
        });

    }
});

// ================= FETCH DEPARTMENT COMPLAINTS =================

// WATER
app.get("/complaints/water", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "water" })
            .sort({ createdAt: -1 });

        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

// ROAD
app.get("/complaints/road", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "road" })
            .sort({ createdAt: -1 });

        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

// ELECTRIC
app.get("/complaints/electric", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "electric" })
            .sort({ createdAt: -1 });

        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

// MUNICIPAL
app.get("/complaints/municipal", async (req, res) => {
    try {
        const complaints = await Complaint.find({ department: "municipal" })
            .sort({ createdAt: -1 });
        return res.json({ success: true, complaints });
    } catch (err) {
        return res.json({ success: false, message: "Server error" });
    }
});

app.post("/update-status", async (req, res) => {

    try {

        const { complaintId, newStatus } = req.body;

        if (!complaintId || !newStatus) {
            return res.json({
                success: false,
                message: "Missing fields"
            });
        }

        // find complaint
        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.json({
                success: false,
                message: "Complaint not found"
            });
        }

        const oldStatus = complaint.status;

        // update status
        complaint.status = newStatus;
        await complaint.save();

        // send email to user
        const mailOptions = {
            from: "sachithbalaka@gmail.com",
            to: complaint.email,
            subject: "Civica Complaint Status Update",
            text: `Hello,

Your complaint status has been updated.

Previous Status: ${oldStatus}
New Status: ${newStatus}

Thank you for using Civica.`
        };

        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: "Status updated and email sent"
        });

    } catch (err) {

        console.log(err);

        return res.json({
            success: false,
            message: "Server error"
        });

    }

});

app.get("/complaint-stats", async (req, res) => {

    try {

        const stats = await Complaint.aggregate([
            {
                $group: {
                    _id: {
                        department: "$department",
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats
        });

    } catch (err) {

        res.json({
            success: false,
            message: "Server error"
        });

    }

});

app.get("/user-complaints/:email", async (req, res) => {

    try {

        const { email } = req.params;

        const complaints = await Complaint.find({ email })
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            complaints
        });

    } catch (err) {

        res.json({
            success: false,
            message: "Server error"
        });

    }

});


const PORT = process.env.PORT || 2000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})