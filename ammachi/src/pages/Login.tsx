import { useState, useEffect } from "react";
import { FaGoogle, FaLinkedin, FaGithub } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router";
import AmmachiImg from "../assets/login.png";
import AmmachiMobileImg from "../assets/phonelogin.png";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();
    
    window.addEventListener("resize", handleResize);
    
    // cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
    } else {
      console.log("Login successful!", data);
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const handleLinkedinLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "linkedin" });
  };

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col md:flex-row font-inter"
      style={{
        background: 'linear-gradient(to bottom, #c8e2f9, #6ecdeb, #243c74)',
      }}
    >
      {/* Left Side: Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-0 order-2 md:order-1">
        <div className="w-full max-w-xl p-6 md:p-10 space-y-6 bg-white rounded-2xl shadow-lg md:mx-8">
          <div className="text-left pl-2">
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-600">Login to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 text-white rounded-lg text-sm font-medium shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              Log in
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="text-2xl flex justify-evenly">
              <FaGoogle onClick={handleGoogleLogin} className="cursor-pointer hover:text-red-500" />
              <FaLinkedin onClick={handleLinkedinLogin} className="cursor-pointer hover:text-blue-500" />
              <FaGithub onClick={handleGithubLogin} className="cursor-pointer hover:text-gray-700" />
            </div>
          </form>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/" className="text-blue-600 font-medium hover:underline">
              Sign up!
            </a>
          </div>
        </div>
      </div>

      {/* Right Side: Ammachi Image */}
      <div className="w-full md:w-1/2 flex justify-center items-end p-0 h-[30vh] md:h-full order-1 md:order-2">
        <img
          src={isMobile ? AmmachiMobileImg : AmmachiImg}
          alt="Ammachi Scolding"
          className="object-contain h-full w-full"
        />
      </div>
    </div>
  );
};