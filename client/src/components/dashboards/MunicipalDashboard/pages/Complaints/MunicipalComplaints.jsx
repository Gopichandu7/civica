import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";

const MunicipalComplaints = () => {

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("Pending");
    const [areas, setAreas] = useState({});

    const fetchComplaints = async () => {
        try {

            const res = await axios.get(`${API_BASE_URL}/complaints/municipal`);

            if (res.data.success) {

                const data = res.data.complaints;
                setComplaints(data);

                data.forEach(getAreaName);
            }

        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const getAreaName = async (item) => {

        if (areas[item._id]) return;

        try {

            const { lat, lng } = item.location;

            const res = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );

            const area =
                res.data.address.suburb ||
                res.data.address.village ||
                res.data.address.town ||
                res.data.address.city ||
                "Unknown Area";

            setAreas(prev => ({
                ...prev,
                [item._id]: area
            }));

        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const updateStatus = async (id, newStatus) => {

        try {

            await axios.post(`${API_BASE_URL}/update-status`, {
                complaintId: id,
                newStatus: newStatus
            });

            setComplaints(prev =>
                prev.map(c =>
                    c._id === id ? { ...c, status: newStatus } : c
                )
            );

        } catch (err) {
            console.log(err);
        }
    };

    const filteredComplaints = complaints
    .filter(item => item.status === statusFilter)
    .sort((a, b) => b.priorityScore - a.priorityScore);

    if (loading) return <div className="MunicipalComplaints">Loading...</div>;

    return (

        <div className="MunicipalComplaints">

            <div className="deptTop">

                <h2>Municipal Department Complaints</h2>

                <div className="deptNav">

                    <div
                        className={statusFilter === "Pending" ? "active" : ""}
                        onClick={() => setStatusFilter("Pending")}
                    >
                        Pending
                    </div>

                    <div
                        className={statusFilter === "In Progress" ? "active" : ""}
                        onClick={() => setStatusFilter("In Progress")}
                    >
                        In Progress
                    </div>

                    <div
                        className={statusFilter === "Resolved" ? "active" : ""}
                        onClick={() => setStatusFilter("Resolved")}
                    >
                        Resolved
                    </div>

                </div>

            </div>

            {filteredComplaints.length === 0 && (
                <p className="noData">No complaints found.</p>
            )}

            <div className="deptContainer">

                {filteredComplaints.map((item) => (

                    <div key={item._id} className="deptCard">

                        <img
                            src={`${API_BASE_URL}/${item.imagePath.replace(/\\/g, "/")}`}
                            alt="complaint"
                        />

                        <div className="deptInfo">

                            <p><strong>Email:</strong> {item.email}</p>

                            <p><strong>Description:</strong> {item.description}</p>

                            {/* Status Row */}
                            <div className="statusRow">

                                <p className={`status ${item.status.replace(" ", "").toLowerCase()}`}>
                                    <strong>Status:</strong> {item.status}
                                </p>

                                <select
                                    className="statusSelect"
                                    value={item.status}
                                    onChange={(e) => updateStatus(item._id, e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>

                            </div>

                            <p>
                                <strong>Location:</strong>{" "}
                                {areas[item._id] || "Loading area..."} |{" "}
                                <a
                                    href={`https://www.google.com/maps?q=${item.location.lat},${item.location.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mapLink"
                                >
                                    View Map
                                </a>
                            </p>

                            <p>
                                <strong>Date:</strong>{" "}
                                {new Date(item.createdAt).toLocaleString()}
                            </p>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );
};

export default MunicipalComplaints;