import React from "react";
import { Link } from "react-router-dom";
import ammachiImage from "../assets/404.png"; // Adjust path if needed

const NotFound: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-200 to-blue-400 flex flex-col items-center">
      {/* 404 Content */}
      <div className="text-center z-10 mt-50">
        <h1 className="text-[12rem] font-bold text-white leading-none">404</h1>
        <p className="text-4xl py-4 px-4 text-white font-semibold mt-2">
          Welp! Something went wrong
        </p>
        <p className="text-2xl font-extrabold text-white opacity-90">വാഴക്കൊമ്പും വരെ ഇല്ല ഇവിടെ!!</p>
      </div>

      {/* Bottom section with button and image */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {/* Ammachi Image (lower z-index) */}
        <img
          src={ammachiImage}
          alt="Ammachi surprised"
          className="w-[400px] z-10"
        />
        
        {/* Go Home Button (higher z-index) */}
        <Link
          to="/"
          className="absolute bottom-[60px] px-6 py-2 bg-white text-pink-500 font-semibold rounded-full shadow hover:bg-blue-100 transition z-10"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;