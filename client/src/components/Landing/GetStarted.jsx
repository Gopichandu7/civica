import {useNavigate} from 'react-router-dom'
const GetStarted = () => {
    const navigate=useNavigate()
    return (
        <div className="GetStarted">
            <div className="gsTop">
                <div className="gsCard" onClick={() => navigate('/Start/User')}>
                    <div className="gsImg user"></div>
                    <div className="gsText">User</div>
                </div>
                <div className="gsCard">
                    <div className="gsImg municipal" onClick={() => navigate('/Start/Municipal')}></div>
                    <div className="gsText">Municipal</div>
                </div>
                <div className="gsCard">
                    <div className="gsImg electrical" onClick={() => navigate('/Start/Electric')}></div>
                    <div className="gsText">Electrical</div>
                </div>
            </div>
            <div className="gsBot">
                <div className="gsCard">
                    <div className="gsImg water" onClick={() => navigate('/Start/Water')}></div>
                    <div className="gsText">Water</div>
                </div>
                <div className="gsCard">
                    <div className="gsImg road" onClick={() => navigate('/Start/Road')}></div>
                    <div className="gsText">Road</div>
                </div>
            </div>
        </div>
    )
}
export default GetStarted
