import { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../../../../../config";

const RaiseComplaint = () => {

    const [image, setImage] = useState(null);
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState(null);
    const [message, setMessage] = useState("");
    const [kind, setKind] = useState("");

    // 📍 Get Live Location
    const getLocation = () => {
        if (!navigator.geolocation) {
            setKind("bad");
            setMessage("Geolocation not supported.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setKind("good");
                setMessage("Location captured successfully.");
            },
            () => {
                setKind("bad");
                setMessage("Location permission denied.");
            }
        );
    };

    // 📂 Handle Image Drop
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) setImage(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setImage(file);
    };

    // 🌦 Weather Score
    const getWeatherScore = async (lat, lng) => {
        try {
            const res = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
            );

            const windSpeed = res.data.current_weather.windspeed;

            if (windSpeed > 25) return 3;
            if (windSpeed > 15) return 2;

            return 1;

        } catch {
            return 1;
        }
    };

    // 🏥 Nearby Hospital Score
    const getPlaceScore = async (lat, lng) => {
        try {

            const res = await axios.get(
                `https://overpass-api.de/api/interpreter?data=[out:json];node(around:300,${lat},${lng})["amenity"="hospital"];out;`
            );

            if (res.data.elements.length > 0) return 3;

            return 1;

        } catch {
            return 1;
        }
    };

    // 🏙 Population Density Score
    const getPopulationScore = async (lat, lng) => {
        try {

            const res = await axios.get(
                `https://overpass-api.de/api/interpreter?data=[out:json];node(around:300,${lat},${lng})["building"];out;`
            );

            const count = res.data.elements.length;

            if (count > 50) return 3;
            if (count > 20) return 2;

            return 1;

        } catch {
            return 1;
        }
    };

    // 🚗 Traffic Score (Major Roads)
    const getTrafficScore = async (lat, lng) => {
        try {

            const res = await axios.get(
                `https://overpass-api.de/api/interpreter?data=[out:json];way(around:200,${lat},${lng})["highway"~"motorway|primary|trunk|secondary"];out;`
            );

            if (res.data.elements.length > 0) return 3;

            return 1;

        } catch {
            return 1;
        }
    };

    // 🚀 Submit Complaint
    const handleSubmit = async () => {

        if (!image || !description) {
            setKind("bad");
            setMessage("All fields are required.");
            return;
        }

        if (!location) {
            setKind("bad");
            setMessage("Location not captured yet.");
            return;
        }

        try {

            const token = localStorage.getItem("token");

            if (!token) {
                setKind("bad");
                setMessage("Authentication failed.");
                return;
            }

            const decoded = jwtDecode(token);
            const email = decoded.email;

            // ⭐ Get all priority scores
            const weatherScore = await getWeatherScore(location.lat, location.lng);
            const placeScore = await getPlaceScore(location.lat, location.lng);
            const populationScore = await getPopulationScore(location.lat, location.lng);
            const trafficScore = await getTrafficScore(location.lat, location.lng);

            // ⏰ Peak hour score
            const hour = new Date().getHours();
            let peakScore = 0;

            if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
                peakScore = 2;
            }

            // 🧠 Final Priority Score
            const priorityScore =
                weatherScore +
                placeScore +
                populationScore +
                trafficScore +
                peakScore;

            const formData = new FormData();
            formData.append("email", email);
            formData.append("image", image);
            formData.append("description", description);
            formData.append("lat", location.lat);
            formData.append("lng", location.lng);
            formData.append("priorityScore", priorityScore);

            const res = await axios.post(
                `${API_BASE_URL}/raise-complaint`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            if (res.data.success) {

                const department = res.data.department;

                setKind("good");
                setMessage(
                    `Complaint submitted successfully! Assigned to ${department.toUpperCase()} department.`
                );

                setImage(null);
                setDescription("");
                setLocation(null);

            } else {

                setKind("bad");
                setMessage(res.data.message);

            }

        } catch (err) {

            setKind("bad");
            setMessage("Submission failed. Try again. Error: " + err.message);

        }
    };

    return (
        <div className="RaiseComplaint">
            <div className="rcCard">

                <h2>Raise Complaint</h2>

                <div
                    className="dropArea"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {image ? (
                        <p>{image.name}</p>
                    ) : (
                        <>
                            <p>Drag & Drop Image Here</p>
                            <p>or</p>
                            <label className="browseBtn">
                                Browse
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        </>
                    )}
                </div>

                <textarea
                    placeholder="Enter description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="locBtn" onClick={getLocation}>
                    <i className="fa-solid fa-location-dot"></i>&nbsp;
                    Capture Location
                </div>

                {message && (
                    <div className={`rcMessage ${kind}`}>
                        {message}
                    </div>
                )}

                <div className="submitBtn" onClick={handleSubmit}>
                    Submit Complaint
                </div>

            </div>
        </div>
    );
};

export default RaiseComplaint;