
import { Route, Routes } from "react-router";
import { SignUpForm } from './pages/signup';
import { LoginForm } from './pages/Login';
// import Dashboard from './pages/dashboard';
import { Toaster } from "react-hot-toast";
// import WebcamMood from "./pages/webcam";

const App = () => {
  return(
    <div>
      
      <Routes>
        <Route path="/" element={<SignUpForm />}/>
        <Route path="/login" element={<LoginForm/>}/>
        {/* <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/webcam" element={<WebcamMood />}/> */}
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
      
    </div>
  )
}

export default App