import { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../../../../../config";

const UserHome = () => {

    const [name,setName] = useState("");
    const [stats,setStats] = useState({});
    const [loaded,setLoaded] = useState(false);

    const fetchStats = async ()=>{

        try{

            const res = await axios.get(`${API_BASE_URL}/complaint-stats`);

            if(res.data.success){

                const data = {};

                res.data.stats.forEach(item=>{

                    const dept = item._id.department;
                    const status = item._id.status;

                    if(!data[status]) data[status] = {};

                    data[status][dept] = item.count;

                });

                setStats(data);

            }

        }catch(err){
            console.log(err);
        }

    };

    if(!loaded){

        const token = localStorage.getItem("token");

        if(token){
            const decoded = jwtDecode(token);
            const username = decoded.email.split("@")[0];
            setName(username);
        }

        fetchStats();
        setLoaded(true);
    }

    const getCount = (status,dept)=>{
        return stats?.[status]?.[dept] || 0;
    };

    return (

        <div className="uh_container">

            {/* Greeting Card */}
            <div className="uh_greetCard">

                <div className="uh_greetHello">
                    Hello
                </div>

                <div className="uh_greetName">
                    {name}
                </div>

            </div>


            {/* Pending Section */}
            <div className="uh_section">

                <h3 className="uh_sectionTitle">Pending Complaints</h3>

                <div className="uh_cardGrid">

                    <div className="uh_statCard">
                        <p>Water</p>
                        <span>{getCount("Pending","water")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Road</p>
                        <span>{getCount("Pending","road")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Electric</p>
                        <span>{getCount("Pending","electric")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Municipal</p>
                        <span>{getCount("Pending","municipal")}</span>
                    </div>

                </div>

            </div>


            {/* In Progress */}
            <div className="uh_section">

                <h3 className="uh_sectionTitle">In Progress Complaints</h3>

                <div className="uh_cardGrid">

                    <div className="uh_statCard">
                        <p>Water</p>
                        <span>{getCount("In Progress","water")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Road</p>
                        <span>{getCount("In Progress","road")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Electric</p>
                        <span>{getCount("In Progress","electric")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Municipal</p>
                        <span>{getCount("In Progress","municipal")}</span>
                    </div>

                </div>

            </div>


            {/* Resolved */}
            <div className="uh_section">

                <h3 className="uh_sectionTitle">Resolved Complaints</h3>

                <div className="uh_cardGrid">

                    <div className="uh_statCard">
                        <p>Water</p>
                        <span>{getCount("Resolved","water")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Road</p>
                        <span>{getCount("Resolved","road")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Electric</p>
                        <span>{getCount("Resolved","electric")}</span>
                    </div>

                    <div className="uh_statCard">
                        <p>Municipal</p>
                        <span>{getCount("Resolved","municipal")}</span>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default UserHome;