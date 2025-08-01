import React from "react";
import { Link } from "react-router-dom";
import ammachiImage from "../assets/404.png"; // Adjust path if needed

const NotFound: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-200 to-blue-400 flex items-centre justify-center">
      {/* 404 Content */}
      <div className="text-center z-10">
        <h1 className="text-[12rem] font-bold text-white leading-none">404</h1>
        <p className="text-2xl text-white font-semibold mt-2">
          വഴക്കൊന്നും വല്ലരേ ഇല്ല ഇവിടേ!
        </p>
        <p className="text-lg text-white opacity-90">Welp! Something went wrong</p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-2 bg-white text-pink-500 font-semibold rounded-full shadow hover:bg-blue-100 transition"
        >
          Go Home
        </Link>
      </div>

      {/* Ammachi Image */}
      <img
        src={ammachiImage}
        alt="Ammachi surprised"
        className="absolute bottom-0 mx-auto left-1/2 transform -translate-x-1/2 z-20 w-[300px]"
      />
    </div>
  );
};

export default NotFound;
