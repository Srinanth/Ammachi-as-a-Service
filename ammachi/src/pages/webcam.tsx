"use client";

import  { useEffect, useState, useRef } from "react";
import Human from "@vladmandic/human";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router";


const WebcamMood = () => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Ammachi is getting ready...");
  const [showResponse, setShowResponse] = useState(false);
  const [showDashboardButton, setShowDashboardButton] = useState(false);
   const navigate = useNavigate();

  const loadingMessages = [
    "Ammachi is looking at you closely...",
    "Be ready... Ammachi is judging!",
    "Hmm... what is this expression?",
    "Ammachi is reading your face like a book!",
    "Eyes wide open... she’s watching!",
  ];

  const human = new Human({
    backend: "webgl",
    cacheSensitivity: 0,
    async: true,
    face: {
      enabled: true,
      detector: { rotation: true },
      mesh: { enabled: false },
      iris: { enabled: false },
      emotion: { enabled: true },
    },
    modelBasePath: "/models", // ensure models are in /public/models
  });

  useEffect(() => {
    const setup = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamRef.current.play();
      }

      await human.load();
      await human.warmup();

      startDetection();
    };

    setup();
  }, []);

  const updateLoadingText = () => {
    const index = Math.floor(Math.random() * loadingMessages.length);
    setLoadingText(loadingMessages[index]);
  };

  const startDetection = async () => {
    const startTime = Date.now();
    const emotionCounts: Record<string, number> = {};

    const detect = async () => {
      const result = await human.detect(webcamRef.current!);
      const emotion = result?.face?.[0]?.emotion?.[0]?.emotion;

      if (emotion) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < 7000) {
        updateLoadingText();
        setTimeout(detect, 1000);
      } else {
        finishDetection(emotionCounts);
      }
    };

    detect();
  };

  const finishDetection = async (emotionCounts: Record<string, number>) => {
    const finalMood = Object.entries(emotionCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    setMood(finalMood);
    setShowResponse(true);
    await updateUserMood(finalMood);
    setShowDashboardButton(true);
  };

  const updateUserMood = async (mood: string) => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return;

    const adjustment = ["neutral", "sad", "angry"].includes(mood) ? -10 : 10;

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("mood_level")
      .eq("id", user.id)
      .single();

    if (!fetchError && data?.mood_level !== undefined) {
      const newMoodLevel = Math.min(100, Math.max(0, data.mood_level + adjustment));
      await supabase.from("users").update({
        mood_level: newMoodLevel,
        mood_label: mood,
      }).eq("id", user.id);
    }
  };

  const getAmmachiResponse = (mood: string) => {
    switch (mood) {
      case "happy":
        return "Ohh, you smiling ah? Good good!";
      case "sad":
        return "Why this sad face? You want pickle?";
      case "angry":
        return "Ey! Don’t show me that fire face!";
      case "surprised":
        return "Ayyyo what happened? Ghost came ah?";
      case "neutral":
        return "Why sitting like statue? Do something!";
      case "fearful":
        return "Scared ah? Ammachi will protect!";
      case "disgusted":
        return "Ughh, that’s your face? Chee!";
      default:
        return "I don't understand this expression!";
    }
  };
  const handleGoToDashboard = () => {
    // Stop the webcam stream
    if (webcamRef.current?.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    navigate("/dashboard"); // Adjust the route as needed
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-white bg-black">
      <h1 className="text-3xl font-bold mb-4">Ammachi Mood Scan</h1>
      <video ref={webcamRef} className="rounded-xl shadow-md mb-4 w-full max-w-md" />

      {!showResponse && (
        <div className="text-xl animate-pulse">{loadingText}</div>
      )}

      {showResponse && mood && (
        <div className="flex flex-col items-center">
          <div className="text-xl mt-4 bg-gray-800 p-4 rounded-xl text-center w-full max-w-md mb-6">
            <span className="font-bold text-yellow-400">Ammachi says: </span>
            <br />
            {getAmmachiResponse(mood)}
          </div>
          
          {showDashboardButton && (
            <button
              onClick={handleGoToDashboard}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors duration-300"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WebcamMood;
