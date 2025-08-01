import { useNavigate } from "react-router-dom";

export const FakeRedirectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <p className="mb-6 text-lg text-gray-700">Oops! Nothing happened. 😏</p>
      <button
        onClick={() => navigate("/dashboard")}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Continue to Dashboard
      </button>
    </div>
  );
};