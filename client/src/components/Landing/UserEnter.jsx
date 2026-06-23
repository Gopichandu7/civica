import { useState } from "react";
import axios from "axios";
import Input from "../common/Input";
import { API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import Message from "../common/Message";

const UserEnter = () => {
    const navigate = useNavigate();
    // 🔁 DIV STATES
    const [signinDiv, setSigninDiv] = useState(true);
    const [signupDiv, setSignupDiv] = useState(false);
    const [otpDiv, setOtpDiv] = useState(false);
    const [passwordDiv, setPasswordDiv] = useState(false);

    // 🔤 INPUT STATES
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
    const [otp, setOtp] = useState("");

    // 👁 PASSWORD TOGGLE
    const [showPass, setShowPass] = useState(false);

    // 📢 MESSAGE
    const [msg, setMsg] = useState("");
    const [kind, setKind] = useState("bad");

    // 🔄 HELPERS
    const showSignin = () => {
        setSigninDiv(true);
        setSignupDiv(false);
        setOtpDiv(false);
        setPasswordDiv(false);
        setMsg("");
    };

    const showSignup = () => {
        setSigninDiv(false);
        setSignupDiv(true);
        setOtpDiv(false);
        setPasswordDiv(false);
        setMsg("");
    };

    // 📩 SEND OTP
    const sendOtp = async () => {
        if (!email) {
            setKind("bad");
            setMsg("Email is required");
            return;
        }

        try {
            const res = await axios.post(
                `${API_BASE_URL}/send_otp`,
                { email }
            );

            if (res.data.success) {
                setKind("good");
                setMsg(res.data.message || "OTP sent to your email");
                setSignupDiv(false);
                setOtpDiv(true);
            } else {
                setKind("bad");
                setMsg(res.data.message || "Failed to send OTP");
            }
        } catch (error) {
            setKind("bad");
            setMsg("Server error while sending OTP" + error.message);
        }
    };


    // ✅ VERIFY OTP
    const verifyOtp = async () => {
        if (!otp) {
            setKind("bad");
            setMsg("Please enter OTP");
            return;
        }

        try {
            const res = await axios.post(
                `${API_BASE_URL}/verify-otp`,
                { email, otp }
            );

            if (res.data.success) {
                setKind("good");
                setMsg(res.data.message || "OTP verified");
                setOtpDiv(false);
                setPasswordDiv(true);
            } else {
                setKind("bad");
                setMsg(res.data.message || "Invalid OTP");
            }
        } catch (error) {
            setKind("bad");
            setMsg("Server error while verifying OTP" + error.message);
        }
    };


    // 🔐 FINAL SIGNUP
    const finalSignup = async () => {
        if (password !== confirmPassword) {
            setKind("bad");
            setMsg("Passwords do not match");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/signup`, {
                email,
                password,
            });

            if (res.data.success) {
                setKind("good");
                setMsg("Signup successful");
                localStorage.setItem("token", res.data.token);
                navigate("/UserDashboard");
            } else {
                setKind("bad");
                setMsg(res.data.message);
            }
        } catch {
            setKind("bad");
            setMsg("Signup failed");
        }
    };

    const handleSignin = async () => {
        if (!email || !password) {
            setKind("bad");
            setMsg("Email and password required");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/signin`, {
                email,
                password,
            });

            if (res.data.success) {
                setKind("good");
                setMsg("Signin successful");

                // 🔐 Store JWT
                localStorage.setItem("token", res.data.token);
                navigate("/UserDashboard"); // make sure route name matches exactly

            } else {
                setKind("bad");
                setMsg(res.data.message || "Invalid credentials");
            }

        } catch (error) {
            setKind("bad");
            setMsg("Server error during signin: " + error.message);
        }
    };

    return (
        <div className="UserEnter">
            <div className="UserEnterLeft">
                <div className="heroText">
                    <div className="line line1">FOR : </div>

                    <div className="line line2">
                        <span className="word active">SMARTER</span>
                        <span className="word">FASTER</span>
                        <span className="word">EVERY</span>
                    </div>

                    <div className="line line3">
                        <span className="word active">COMMUNITY</span>
                        <span className="word">RESOLUTION</span>
                        <span className="word">CITIZEN</span>
                    </div>
                </div>
            </div>
            <div className="UserEnterRight">
                <div className="details">
                    {/* 🔹 SIGN IN */}
                    {signinDiv && (
                        <div className="formBox">
                            <h2>Sign In</h2>

                            <Input placeholder="Enter Email" value={email} setValue={setEmail} />

                            <div className="passBox">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="Enter Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <i
                                    className={`fa ${showPass ? "fa-eye-slash" : "fa-eye"}`}
                                    onClick={() => setShowPass(!showPass)}
                                ></i>
                            </div>

                            <Message kind={kind} text={msg} />

                            <div className="detBot" onClick={handleSignin}>
                                Sign In
                            </div>

                            <p className="link" onClick={showSignup}>Click here if new user</p>
                        </div>
                    )}

                    {/* 🔹 SIGN UP */}
                    {signupDiv && (
                        <div className="formBox">
                            <h2>Sign Up</h2>

                            <Input placeholder="Enter Username" value={username} setValue={setUsername} />
                            <Input placeholder="Enter Email" value={email} setValue={setEmail} />

                            <Message kind={kind} text={msg} />

                            <div className="detBot" onClick={sendOtp}>
                                Next
                            </div>

                            <p className="link" onClick={showSignin}>Click here if old user</p>
                        </div>
                    )}

                    {/* 🔹 OTP */}
                    {otpDiv && (
                        <div className="formBox">
                            <h2>Verify OTP</h2>

                            <Input placeholder="Enter OTP" value={otp} setValue={setOtp} />

                            <Message kind={kind} text={msg} />

                            <div className="detBot" onClick={verifyOtp}>
                                Verify
                            </div>

                            <p className="link" onClick={showSignup}>Back</p>
                        </div>
                    )}

                    {/* 🔹 PASSWORD */}
                    {passwordDiv && (
                        <div className="formBox">
                            <h2>Create Password</h2>

                            <div className="passBox">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="Enter Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <i
                                    className={`fa ${showPass ? "fa-eye-slash" : "fa-eye"}`}
                                    onClick={() => setShowPass(!showPass)}
                                ></i>
                            </div>

                            <Input
                                type={showPass ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                setValue={setConfirmPassword}
                            />

                            <Message kind={kind} text={msg} />

                            <div className="detBot" onClick={finalSignup}>
                                Signup
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default UserEnter;
