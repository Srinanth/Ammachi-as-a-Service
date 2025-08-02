import { useNavigate } from "react-router-dom";
import ammachiImage from "../assets/happy.png"; // Make sure the path is correct

export const FakeRedirectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 p-4">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <img
          src={ammachiImage}
          alt="Ammachi"
          style={{ imageRendering: "auto" }}
          className="w-50 h-60 "
        />
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Ammachi has fooled you here 😈
          </h1>
          <p className="mb-6 text-gray-700">Oops! Nothing happened. 😏</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
