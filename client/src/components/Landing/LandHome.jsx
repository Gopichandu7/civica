import { useNavigate } from "react-router-dom";

const LandHome = () => {
    const navigate = useNavigate();

    return (
        <div className="LandHome">
            {/* LEFT TEXT */}
            <div className="homeLeft">
                <div className="homeText">
                    <div className="homeLine static">Need A</div>
                    <div className="homeLine static">Better</div>
                    <div className="homeLine typing">Tomorrow</div>
                </div>
            </div>

            {/* RIGHT QUESTION */}
            <div className="homeRight">
                <div className="bigQuestion">?</div>
                <div
                    className="homeBtn"
                    onClick={() => navigate("/Start")}
                >
                    Click Here
                </div>
            </div>
        </div>
    );
};

export default LandHome;
