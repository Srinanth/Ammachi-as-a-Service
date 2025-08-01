import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { FiSend, FiChevronLeft, FiChevronRight, FiArrowUp, FiArrowDown, FiLogOut } from "react-icons/fi";
import AmmachiImage from "../assets/login.png";
import { useNavigate } from "react-router-dom";

type Ammachi = {
  id: string;
  name: string;
  description?: string;
  mood_quotes?: {
    happy: string;
    neutral: string;
    angry: string;
  };
  image_url?: string;
};

type ChatMessage = {
  sender: 'ammachi' | 'user';
  text: string;
};

const Dashboard = () => {
  const [ammachis, setAmmachis] = useState<Ammachi[]>([]);
  const [currentAmmachiIndex, setCurrentAmmachiIndex] = useState(0);
  const [moodLevel, setMoodLevel] = useState<number>(100);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scoldInterval = useRef<NodeJS.Timeout | null>(null);
  const scoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const selectedAmmachi = ammachis[currentAmmachiIndex] || null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const fetchAmmachiTypes = async () => {
      const { data, error } = await supabase.from("ammachi_types").select("*");
      if (error) toast.error("Failed to load Ammachis");
      else setAmmachis(data || []);
    };

    const getCurrentUserInfo = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw error || new Error("User not logged in");
        setCurrentUserId(user.id);
        setUserEmail(user.email ?? null);
        return user;
      } catch (error) {
        toast.error("User not logged in");
        navigate("/");
      }
    };

    fetchAmmachiTypes();
    getCurrentUserInfo();
    startConversation();
  }, []);

  const startConversation = () => {
    let greeting = "";
    if (moodLevel >= 80) {
      greeting = "Hello beta! How are you doing today? Have you eaten your food?";
    } else if (moodLevel >= 50) {
      greeting = "Hmm, you're here. How are you?";
    } else {
      greeting = "What do you want now? I'm busy!";
    }
    setChatMessages([{ sender: 'ammachi', text: greeting }]);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text: userInput }];
    setChatMessages(newMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/ammachi-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodLevel,
          userInput,
          questionCount: 0
        })
      });

      const data = await response.json();
      setChatMessages(prev => [...prev, { sender: 'ammachi', text: data.response }]);
      if (data.mood !== null) setMoodLevel(data.mood);
    } catch (error) {
      toast.error("Failed to get response from Ammachi");
      setChatMessages(prev => [...prev, { sender: 'ammachi', text: "I'm too upset to talk right now. Try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const nextAmmachi = () => {
    setCurrentAmmachiIndex((prev) => (prev + 1) % ammachis.length);
  };

  const prevAmmachi = () => {
    setCurrentAmmachiIndex((prev) => (prev - 1 + ammachis.length) % ammachis.length);
  };

  const getMoodQuote = () => {
    if (!selectedAmmachi?.mood_quotes) {
      if (moodLevel >= 70) return "Hello beta, how are you doing today?";
      else if (moodLevel >= 40) return "What do you want now?";
      else return "I'm not happy with you!";
    }
    
    if (moodLevel >= 70) return selectedAmmachi.mood_quotes.happy;
    else if (moodLevel >= 40) return selectedAmmachi.mood_quotes.neutral;
    else return selectedAmmachi.mood_quotes.angry;
  };

  const toggleChat = () => {
    setIsChatExpanded(!isChatExpanded);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };


  const sendEmail = async (email: string, userId: string, frontendUrl: string, message: string) => {
    const res = await fetch("http://localhost:5000/api/send-ammachi-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, message, userId, frontendUrl })
    });

    if (!res.ok) throw new Error("Email failed");
    await supabase.from("users").update({ last_email_sent_at: new Date().toISOString() }).eq("id", userId);
  };

  const startEmailBombardment = async (userId: string, email: string) => {
    const frontendUrl = window.location.origin;
    const message = `⚠️ Ammachi "${selectedAmmachi?.name}" has been activated!\n\n${selectedAmmachi?.description || "Strict vibes incoming!"}`;

    await supabase.from("users").update({
      needs_scolding: true,
      last_email_sent_at: new Date().toISOString(),
      ammachi_type_id: selectedAmmachi?.id
    }).eq("id", userId);

    await sendEmail(email, userId, frontendUrl, message);

    scoldInterval.current = setInterval(async () => {
      await sendEmail(email, userId, frontendUrl, message);
    }, 2 * 60 * 1000);

    scoldTimeout.current = setTimeout(() => {
      if (scoldInterval.current) {
        clearInterval(scoldInterval.current);
      }
    }, 10 * 60 * 1000);
  };

  const handleSelectAmmachi = async () => {
    if (!selectedAmmachi || !currentUserId || !userEmail) {
      toast.error("Please select an Ammachi");
      return;
    }
    try {
      toast.success("Ammachi selected! Emails incoming!");
      await startEmailBombardment(currentUserId, userEmail);
    } catch (error) {
      toast.error("Failed to activate Ammachi");
    }
  };

  return (
    <div className="relative h-screen w-full bg-blue-100 p-6 overflow-hidden flex flex-col items-center ">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        <FiLogOut className="text-lg" /> Logout
      </button>
      
      {/* Ammachi Selector Card */}
      <div className="bg-white/80 p-6 rounded-lg shadow-md w-full max-w-4xl mb-8 mt-10">
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={prevAmmachi}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FiChevronLeft className="text-xl" />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{selectedAmmachi?.name }</h1>
            <p className="text-gray-600 text-sm mb-4">{selectedAmmachi?.description || ""}</p>
            
            {/* Select Ammachi Button */}
            <button
              onClick={handleSelectAmmachi}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium w-full max-w-xs mx-auto"
            >
              Select Ammachi
            </button>
            

          </div>
          
          <button 
            onClick={nextAmmachi}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FiChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      {/* Mood and Quote Card with Image */}
      <div className="relative w-full max-w-4xl mb-8 mt-10">
        {/* Ammachi Image - Positioned to the left */}
        <div className="absolute -top-8 left-8 z-10">
          <img 
            src={AmmachiImage} 
            alt={selectedAmmachi?.name || "Ammachi"} 
            className="w-40 h-40 object-cover rounded-lg"
          />
        </div>

        {/* Mood and Quote Card */}
        <div className="bg-white/80 p-8 pt-20 rounded-lg shadow-md">
          {/* Mood Bar - Centered */}
          <div className="mb-6 text-center">
            <h3 className="font-medium mb-2">Mood</h3>
            <div className="flex items-center gap-4 justify-center">
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                <div
                  className={`h-full rounded-full ${
                    moodLevel > 70 ? 'bg-green-500' : 
                    moodLevel > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${moodLevel}%` }}
                />
              </div>
              <span className="font-bold text-lg">{moodLevel}</span>
            </div>
          </div>

          {/* Dialogue - Centered */}
          <div className="text-center">
            <h3 className="font-medium mb-2">Dialogue based on mood</h3>
            <p className="text-gray-700 italic">"{getMoodQuote()}"</p>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white/80 shadow-lg rounded-t-lg transition-all duration-300 mx-auto max-w-4xl mb-20 ${
          isChatExpanded ? 'h-1/2' : 'h-16 opacity-70 hover:opacity-90'
        }`}
      >
        <div 
          className="h-16 flex items-center justify-between px-6 border-b cursor-pointer"
          onClick={toggleChat}
        >
          <h2 className="font-semibold">Chat with Ammachi</h2>
          {isChatExpanded ? <FiArrowDown /> : <FiArrowUp />}
        </div>

        {isChatExpanded && (
          <div className="h-[calc(100%-64px)] flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${msg.sender === 'ammachi' ? 'text-left' : 'text-right'}`}
                >
                  <div
                    className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender === 'ammachi' 
                        ? 'bg-blue-100 text-blue-900 rounded-bl-none' 
                        : 'bg-green-100 text-green-900 rounded-br-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-3">
                  <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-700 rounded-bl-none">
                    Ammachi is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                >
                  <FiSend /> Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;