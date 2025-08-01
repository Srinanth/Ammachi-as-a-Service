import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { FiSend, FiChevronLeft, FiChevronRight, FiArrowUp, FiArrowDown, FiLogOut, FiCamera } from "react-icons/fi";
import AmmachiImage from "../assets/login.png";
import { useNavigate, Link } from "react-router-dom";

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
  const [apologyCount, setApologyCount] = useState(0);
  const [needsFaceVerification, setNeedsFaceVerification] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scoldInterval = useRef<NodeJS.Timeout | null>(null);
  const scoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const selectedAmmachi = ammachis[currentAmmachiIndex] || null;

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Fetch ammachi types
        const { data: ammachiData, error: ammachiError } = await supabase
          .from("ammachi_types")
          .select("*");
        
        if (ammachiError) throw ammachiError;
        setAmmachis(ammachiData || []);

        // Get current user info
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error("No user logged in");
        
        setCurrentUserId(user.id);
        setUserEmail(user.email ?? null);

        // Fetch user's current mood and verification status
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("mood_level, needs_face_verification")
          .eq("id", user.id)
          .single();

        if (!userDataError && userData) {
          setMoodLevel(userData.mood_level ?? 100);
          setNeedsFaceVerification(userData.needs_face_verification ?? false);
        }

        startConversation();
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to initialize dashboard");
        navigate("/");
      }
    };

    initializeDashboard();

    return () => {
      if (scoldInterval.current) clearInterval(scoldInterval.current);
      if (scoldTimeout.current) clearTimeout(scoldTimeout.current);
    };
  }, []);



  // Start conversation based on current mood
  const startConversation = () => {
    let greeting = "";
    if (moodLevel >= 80) {
      greeting = "Ente kuttiii! Vaa, kudikkan onnum undo? (My child! Come, do you want something to drink?)";
    } else if (moodLevel >= 50) {
      greeting = "Sheri, parayu. Enikku kure pani und. (Okay, tell me. I have some work.)";
    } else if (moodLevel > 0) {
      greeting = "Ithokke entha karyam? Nee innalathe kuzhappam cheythille? (What's this? Didn't you make a mistake yesterday?)";
    } else {
      greeting = "Poda monae! Njan samadhanam illa! (Go away! I'm not happy!)";
    }
    setChatMessages([{ sender: 'ammachi', text: greeting }]);
  };

  // Handle sending messages
 const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading || (moodLevel <= 0 && needsFaceVerification)) return;

    // Add user message to chat
    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text: userInput }];
    setChatMessages(newMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      // Handle apology flow if mood is 0
      if (moodLevel <= 0) {
        const newApologyCount = apologyCount + 1;
        setApologyCount(newApologyCount);
        
        // Check if user has apologized enough (3 times)
        if (newApologyCount >= 3) {
          const requireVerification = Math.random() > 0.7; // 30% chance
          
          if (requireVerification) {
            setNeedsFaceVerification(true);
            await supabase
              .from('users')
              .update({ 
                needs_face_verification: true,
                mood_level: 0, // Keep mood at 0 until verification
                mood_updated_at: new Date().toISOString()
              })
              .eq('id', currentUserId);
            
            setChatMessages(prev => [
              ...prev,
              { 
                sender: 'ammachi', 
                text: "I don't believe you're sorry! Show me your face first! \n\nGo to: /webcam" 
              }
            ]);
            setIsLoading(false);
            return;
          } else {
            // Forgive the user
            const newMood = 50;
            setMoodLevel(newMood);
            await supabase
              .from('users')
              .update({ 
                mood_level: newMood,
                mood_label: getMoodLabel(newMood),
                mood_updated_at: new Date().toISOString(),
                needs_face_verification: false
              })
              .eq('id', currentUserId);
            
            setChatMessages(prev => [
              ...prev,
              { 
                sender: 'ammachi', 
                text: "Sheri, njan kshamichu. Pakshe again ingane cheythal njan samadhanamilla! (Okay, I forgive. But don't do this again!)" 
              }
            ]);
            setApologyCount(0);
            setIsLoading(false);
            return;
          }
        } else {
          // Still need more apologies
          setChatMessages(prev => [
            ...prev,
            { 
              sender: 'ammachi', 
              text: "Hmph! Ithra thanne? Njan innum valare kopa aanu! (Hmph! Is that all? I'm still very angry!)" 
            }
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Normal conversation flow
      const response = await fetch('http://localhost:5000/api/ammachi-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodLevel,
          userInput,
          questionCount: chatMessages.filter(m => m.sender === 'user').length + 1,
          chatHistory: chatMessages
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Only show the response text, not the mood
      setChatMessages(prev => [...prev, { sender: 'ammachi', text: data.response }]);
      
      // Handle mood update silently
      if (data.mood !== null) {
        const newMood = Math.max(0, Math.min(100, data.mood));
        setMoodLevel(newMood);
        
        // Update all mood-related fields in database
        await supabase
          .from('users')
          .update({ 
            mood_level: newMood,
            mood_label: getMoodLabel(newMood),
            mood_updated_at: new Date().toISOString(),
            ...(newMood > 0 && { needs_face_verification: false }) // Reset verification if mood improved
          })
          .eq('id', currentUserId);
        
        if (newMood <= 0) {
          setChatMessages(prev => [
            ...prev,
            { 
              sender: 'ammachi', 
              text: "Njan valare kopa aanu! Ningal sherikum kshamapetenda! (I'm very angry! You need to apologize properly!)" 
            }
          ]);
          setApologyCount(0);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response from Ammachi");
      setChatMessages(prev => [
        ...prev,
        { 
          sender: 'ammachi', 
          text: "Aiyyo! Enikku ithu parayan pattunilla. Try again later. (Oh no! I can't respond now. Try later.)" 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

// Helper function to get mood label
const getMoodLabel = (level: number): string => {
  if (level >= 80) return 'happy';
  if (level >= 50) return 'neutral';
  if (level > 0) return 'angry';
  return 'very_angry';
};

  // Other helper functions
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
      if (moodLevel >= 80) return "Ente kuttiii! Vaa, kudikkan onnum undo?";
      else if (moodLevel >= 50) return "Sheri, parayu. Enikku kure pani und.";
      else if (moodLevel > 0) return "Ithokke entha karyam? Nee innalathe kuzhappam cheythille?";
      else return "Poda monae! Njan samadhanam illa!";
    }
    
    if (moodLevel >= 80) return selectedAmmachi.mood_quotes.happy;
    else if (moodLevel >= 50) return selectedAmmachi.mood_quotes.neutral;
    else if (moodLevel > 0) return selectedAmmachi.mood_quotes.angry;
    else return "I'm not talking to you! Njan samadhanam illa!";
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
      if (scoldInterval.current) clearInterval(scoldInterval.current);
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
      console.error(error);
      toast.error("Failed to activate Ammachi");
    }
  };

  // Render
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center p-6 bg-gradient-to-b from-[#c8e2f9] via-[#6ecdeb] to-[#243c74]">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-2xl z-50"
      >
        <FiLogOut className="text-lg" /> Logout
      </button>

      {/* Ammachi Selector Card */}
      <div className="bg-white/50 p-6 rounded-3xl shadow-xl w-full max-w-4xl mb-8 mt-10 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4">
          <button onClick={prevAmmachi} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <FiChevronLeft className="text-xl" />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{selectedAmmachi?.name}</h1>
            <p className="text-gray-600 text-sm mb-4">{selectedAmmachi?.description || ""}</p>
            
            <button
              onClick={handleSelectAmmachi}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium w-full max-w-xs mx-auto"
            >
              Select Ammachi
            </button>
          </div>
          
          <button onClick={nextAmmachi} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <FiChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      {/* Mood and Quote Card with Image */}
      <div className="relative w-full max-w-4xl mb-8">
        <div className="absolute -top-8 left-8 z-10">
          <img 
            src={AmmachiImage} 
            alt={selectedAmmachi?.name} 
            className="w-40 h-40 object-cover  "
          />
        </div>

        <div className="bg-white/50 p-8 pt-20 rounded-3xl shadow-xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h3 className="font-medium mb-2">Mood</h3>
            <div className="flex items-center gap-4 justify-center">
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    moodLevel > 70 ? 'bg-green-500' : 
                    moodLevel > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${moodLevel}%` }}
                />
              </div>
              <span className="font-bold text-lg">{moodLevel}</span>
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-medium mb-2">Dialogue based on mood</h3>
            <p className="text-gray-700 italic">"{getMoodQuote()}"</p>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`fixed bottom-20 left-0 right-0 bg-white/50 shadow-xl rounded-t-3xl rounded-b-3xl transition-all duration-300 mx-auto max-w-4xl backdrop-blur-sm ${
        isChatExpanded ? 'h-1/2' : 'h-16'
      }`}>
        <div 
          className="h-16 flex items-center justify-between px-6 cursor-pointer rounded-t-3xl"
          onClick={toggleChat}
        >
          <h2 className="font-semibold">Chat with Ammachi</h2>
          {isChatExpanded ? <FiArrowDown /> : <FiArrowUp />}
        </div>
        
        {isChatExpanded && (
          <div className="h-[calc(100%-64px)] flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.sender === 'ammachi' ? 'text-left' : 'text-right'}`}>
                  <div className={`inline-block max-w-xs px-4 py-2 rounded-2xl ${
                    msg.sender === 'ammachi' 
                      ? 'bg-blue-100/70 text-blue-900 rounded-bl-none' 
                      : 'bg-green-100/70 text-green-900 rounded-br-none'
                  }`}>
                    {msg.text.includes('/webcam') ? (
                      <>
                        {msg.text.replace('/webcam', '')}
                        <Link to="/webcam" className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
                          <FiCamera /> Show my face to Ammachi
                        </Link>
                      </>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-3">
                  <div className="inline-block px-4 py-2 rounded-2xl bg-gray-200/70 text-gray-700 rounded-bl-none">
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
                  placeholder={
                    moodLevel <= 0 
                      ? needsFaceVerification 
                        ? "Complete face verification first" 
                        : "Say sorry to Ammachi (in Malayalam if possible)..."
                      : "Type your message..."
                  }
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                  disabled={isLoading || (moodLevel <= 0 && needsFaceVerification)}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || (moodLevel <= 0 && needsFaceVerification)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-1 ${
                    moodLevel <= 0
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <FiSend /> Send
                </button>
              </div>
              {moodLevel <= 0 && (
                <div className="text-center mt-2 text-sm text-red-600">
                  {needsFaceVerification 
                    ? "Ammachi wants to see your face to believe you're sorry!"
                    : `Apologies given: ${apologyCount}/3 (Ammachi is very angry!)`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;