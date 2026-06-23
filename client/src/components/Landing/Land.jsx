import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import GetStarted from './GetStarted'
import LandHome from './LandHome'
import UserEnter from './UserEnter'
import MunicipalEnter from './MunicipalEnter'
import WaterEnter from './WaterEnter'
import ElectricEnter from './ElectricEnter'
import RoadEnter from './RoadEnter'
const Land = () => {
    const navigate = useNavigate()
    const location = useLocation()
    return (
        <div className='Land'>
            <div className="LandNavbar">
                <div className="lnLeft">
                    <div className="inlLogo" onClick={()=>navigate("/")}></div>
                </div>
                <div className="lnRight">
                    <div
                        className={`lnrHome ${location.pathname === '/' ? 'active' : ''}`}
                        onClick={() => navigate('/')}
                    >
                        Home
                    </div>
                    <div
                        className={`lnrStart ${location.pathname.startsWith('/Start') ? 'active' : ''}`}
                        onClick={() => navigate('/Start')}
                    >
                        GetStarted
                    </div>
                </div>
            </div>
            <div className="LandBody">
                <Routes>
                    <Route path='/' element={<LandHome />} />
                    <Route path='/Start' element={<GetStarted />} />
                    <Route path='/Start/User' element={<UserEnter />} ></Route>
                    <Route path='/Start/Electric' element={<ElectricEnter />} ></Route>
                    <Route path='/Start/Water' element={<WaterEnter />} ></Route>
                    <Route path='/Start/Municipal' element={<MunicipalEnter />} ></Route>
                    <Route path='/Start/Road' element={<RoadEnter />} ></Route>
                </Routes>
            </div>
        </div>
    )
}
export default Land