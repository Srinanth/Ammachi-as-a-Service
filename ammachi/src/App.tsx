
import { Route, Routes } from "react-router";
import { SignUpForm } from './pages/signup';
import { LoginForm } from './pages/Login';
import Dashboard from './pages/dashboard';
import { Toaster } from "react-hot-toast";
import NotFound from "./pages/404";
import WebcamMood from "./pages/webcam";
import { FakeRedirectPage } from "./pages/FakeRedirect";

const App = () => {
  return(
    <div>
      
      <Routes>
        <Route path="/" element={<SignUpForm />}/>
        <Route path="/login" element={<LoginForm/>}/>
       <Route path="/dashboard" element={<Dashboard />}/>
       <Route path="*" element={<NotFound/>}/>
        <Route path="/webcam" element={<WebcamMood />}/>
        <Route path="/haha" element={<FakeRedirectPage />}/>

        
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
      
    </div>
  )
}

export default App