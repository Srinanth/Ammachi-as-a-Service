import { useState, useEffect } from "react";
import { FaGoogle, FaLinkedin, FaGithub } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router";
import AmmachiImg from "../assets/signup.png";
import AmmachiMobileImg from "../assets/phonesignup.png";
import toast from "react-hot-toast";


export const SignUpForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert("Please accept the terms and conditions.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
    toast.error(error.message || "Something went wrong during signup.");      console.error("Signup error:", error.message);
      return;
    }

    const user = data.user;
    if (user) {
      toast.success("Signup successful! Redirecting...");
      console.log("User signed up successfully!");
      navigate("/login");
    }
  };

  const handleGoogleSignUp = async () => {
   navigate("/haha");
  };

  const handleLinkedinSignUp = async () => {
    navigate("/haha");  
  };

  const handleGithubSignUp = async () => {
    navigate("/haha");
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
            <h1 className="text-3xl font-extrabold text-gray-900">Create Account</h1>
            <p className="mt-2 text-sm text-gray-600">Sign up to get started</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Username"
              />
            </div>
            
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

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={() => setAcceptedTerms(!acceptedTerms)}
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 hover:underline"
                  >
                    terms and conditions
                  </button>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!acceptedTerms}
              className={`w-full py-2 px-4 text-white rounded-lg text-sm font-medium shadow-sm ${
                acceptedTerms
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Sign Up
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
              <FaGoogle onClick={handleGoogleSignUp} className="cursor-pointer hover:text-red-500" />
              <FaLinkedin onClick={handleLinkedinSignUp} className="cursor-pointer hover:text-blue-500" />
              <FaGithub onClick={handleGithubSignUp} className="cursor-pointer hover:text-gray-700" />
            </div>
          </form>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-medium hover:underline">
              Login!
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

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900">Terms and Conditions</h2>
            <div className="h-64 overflow-y-auto border border-gray-200 p-3 text-sm text-gray-700">
              <p className="mb-3">
                      <span className="font-semibold">ഇത് വെറും വെബ്സൈറ്റ് മാത്രമാണ്.</span>
                        നിങ്ങളെ ശല്യപ്പെടുത്താൻ മാത്രം ആണ് Ammachi ഇവിടെ ഇരിക്കുന്നതു. Productivity, Knowledge, Skill Development… ഈ കാര്യങ്ങൾക്കൊന്നും ഈ സൈറ്റ് ഉദ്ദേശിച്ചിട്ടില്ല.
              </p>
              <p className="mb-3">
                        <span className="font-semibold">Face Expressions & Clicks ന് വല്ലാത്ത രോഷം കാണിക്കും</span> നിങ്ങളുടെ മുഖം, expressions, click ചെയ്യുന്നത്, ഒന്നും Ammachi-യുടെ കണക്റ്റ് ആക്കിയിട്ടില്ല. എന്നാൽ ഈ Ammachi പറയുന്നത് കേട്ട് നിങ്ങളെ കുറ്റബോധത്തിൽ ആക്കാനാണ് ഈ വെബ്സൈറ്റ് ഉദ്ദേശിക്കുന്നത്.
              </p>
              <p className="mb-3">
              <span className="font-semibold">നിങ്ങളുടെ ഡാറ്റ ഞങ്ങൾ ശേഖരിക്കില്ല.</span> Website കമറാ Access ചോദിക്കും, എന്നാൽ അത് വെറും ഫീച്ചർ മാത്രമാണ്. നിങ്ങളുടെ webcam-ൽ എന്ത് സംഭവിക്കുകയോ, നിങ്ങൾ എന്ത് ചെയ്യുകയോ ഞങ്ങൾ കാണുന്നില്ല. Ammachi-യുടെ കണക്റ്റ് ആക്കിയിട്ടില്ല.
              </p>
              <p>
              <span className="font-semibold">പകരം കിട്ടുന്നത്: ഒരു ചിരി അല്ലെങ്കിൽ തലവേദന.</span> ഈ വെബ്സൈറ്റ് ഉപയോഗിച്ചാൽ നിങ്ങൾക്ക് കിട്ടുന്ന ഒന്നേ ഒന്നു Output ഉണ്ട് — പുഞ്ചിരിയോ തലവേദനയോ!
               </p>
          </div>
<div className="flex justify-end gap-2 pt-4">
  <button
    onClick={() => setShowTerms(false)}
    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
  >
    എനിക്ക് പേടിയാണ് - റദ്ദാക്കുക
  </button>
  <button
    onClick={() => {
      setAcceptedTerms(true);
      setShowTerms(false);
    }}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm shadow-md transition"
  >
    ഞാൻ എൻ്റെ വിധി അംഗീകരിക്കുന്നു
  </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};