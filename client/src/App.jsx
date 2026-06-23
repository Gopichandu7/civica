import Land from './components/Landing/Land'
import UserDashboard from './components/dashboards/userDashboard/UserDashboard'
import WaterDashboard from './components/dashboards/WaterDashboard/WaterDashboard'
import ElectricDashboard from './components/dashboards/ElectriDashboard/ElectricDashboard'
import MunicipalDashboard from './components/dashboards/MunicipalDashboard/MunicipalDashboard'
import RoadDashboard from './components/dashboards/RoadDashboard/RoadDashBoard'
import {Routes,Route} from 'react-router-dom'
const App = () => {
    return (
        <div className="App">
            <Routes>
                <Route path='/*' element={<Land/>} ></Route>
                <Route path='/UserDashboard/*' element={<UserDashboard/>} ></Route>
                <Route path='/WaterDashboard/*' element={<WaterDashboard/>} ></Route>
                <Route path='/ElectricDashboard/*' element={<ElectricDashboard/>} ></Route>
                <Route path='/MunicipalDashboard/*' element={<MunicipalDashboard/>} ></Route>
                <Route path='/RoadDashboard/*' element={<RoadDashboard/>} ></Route>
            </Routes>
        </div>
    )
}
export default App