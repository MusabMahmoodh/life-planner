// import React, { useState, useRef, useEffect } from "react";
// import {
//   Send,
//   Plus,
//   Target,
//   MessageSquare,
//   CheckCircle2,
//   Clock,
// } from "lucide-react";

// const API_URL = "http://localhost:8000/api";

// function App() {
//   const [sessionId, setSessionId] = useState(null);
//   const [coachName, setCoachName] = useState("Alex");
//   const [goalDescription, setGoalDescription] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [screen, setScreen] = useState("SETUP"); // SETUP, CONVERSATION, PLAN_SCREEN
//   const [planData, setPlanData] = useState(null);
//   const [stage, setStage] = useState("");

//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const createSession = async () => {
//     if (!goalDescription.trim()) {
//       alert("Please enter your goal!");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`${API_URL}/session/create`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           coach_name: coachName,
//           goal_description: goalDescription,
//         }),
//       });

//       const data = await response.json();
//       setSessionId(data.session_id);
//       setMessages([{ role: "assistant", content: data.message }]);
//       setScreen("CONVERSATION");
//     } catch (error) {
//       alert("Failed to create session: " + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const sendMessage = async () => {
//     if (!inputMessage.trim()) return;

//     const userMessage = inputMessage;
//     setInputMessage("");
//     setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
//     setLoading(true);

//     try {
//       const response = await fetch(`${API_URL}/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           session_id: sessionId,
//           message: userMessage,
//           coach_name: coachName,
//           goal_description: goalDescription,
//         }),
//       });

//       const data = await response.json();

//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: data.message },
//       ]);
//       setStage(data.stage);

//       // Handle screen changes
//       if (data.flag === "PLAN_SCREEN" && data.plan_data) {
//         setScreen("PLAN_SCREEN");
//         setPlanData(data.plan_data);
//       }
//     } catch (error) {
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: "Sorry, something went wrong: " + error.message,
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const backToChat = () => {
//     setScreen("CONVERSATION");
//   };

//   const newSession = () => {
//     setSessionId(null);
//     setMessages([]);
//     setGoalDescription("");
//     setPlanData(null);
//     setScreen("SETUP");
//     setStage("");
//   };

//   // Setup Screen
//   if (screen === "SETUP") {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//         <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
//           <div className="text-center space-y-2">
//             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
//               <Target className="w-8 h-8 text-white" />
//             </div>
//             <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
//             <p className="text-gray-600">Let's achieve your goals together</p>
//           </div>

//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Coach Name
//               </label>
//               <input
//                 type="text"
//                 value={coachName}
//                 onChange={(e) => setCoachName(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Alex"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 What's your goal?
//               </label>
//               <textarea
//                 value={goalDescription}
//                 onChange={(e) => setGoalDescription(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//                 rows="3"
//                 placeholder="e.g., learn piano, get fit, start a business..."
//               />
//             </div>

//             <button
//               onClick={createSession}
//               disabled={loading}
//               className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? "Creating Session..." : "Start Coaching"}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Plan Screen
//   if (screen === "PLAN_SCREEN" && planData) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
//         <div className="max-w-4xl mx-auto p-6">
//           {/* Header */}
//           <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">
//                   {planData.title}
//                 </h1>
//                 <p className="text-gray-600 mt-1">
//                   Coach: {planData.coach_name}
//                 </p>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={backToChat}
//                   className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
//                 >
//                   <MessageSquare className="w-4 h-4" />
//                   Chat
//                 </button>
//                 <button
//                   onClick={newSession}
//                   className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
//                 >
//                   <Plus className="w-4 h-4" />
//                   New
//                 </button>
//               </div>
//             </div>

//             <div className="flex items-center gap-4 text-sm text-gray-600">
//               <div className="flex items-center gap-1">
//                 <CheckCircle2 className="w-4 h-4" />
//                 <span>
//                   {planData.current_step} / {planData.total_steps} steps
//                 </span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <Target className="w-4 h-4" />
//                 <span>{planData.goal}</span>
//               </div>
//             </div>
//           </div>

//           {/* Steps */}
//           <div className="space-y-4">
//             {planData.steps.map((step, index) => (
//               <div
//                 key={step.id}
//                 className={`bg-white rounded-xl shadow p-6 transition-all ${
//                   index === planData.current_step
//                     ? "ring-2 ring-blue-500 ring-offset-2"
//                     : step.completed
//                     ? "opacity-60"
//                     : ""
//                 }`}
//               >
//                 <div className="flex items-start gap-4">
//                   <div
//                     className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
//                       step.completed
//                         ? "bg-green-100 text-green-600"
//                         : index === planData.current_step
//                         ? "bg-blue-100 text-blue-600"
//                         : "bg-gray-100 text-gray-600"
//                     }`}
//                   >
//                     {step.completed ? "✓" : step.id}
//                   </div>
//                   <div className="flex-1">
//                     <h3 className="text-lg font-semibold text-gray-900 mb-1">
//                       {step.title}
//                     </h3>
//                     <p className="text-gray-600 mb-2">{step.description}</p>
//                     <div className="flex items-center gap-2 text-sm text-gray-500">
//                       <Clock className="w-4 h-4" />
//                       <span>{step.duration}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {planData.modification_note && (
//             <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//               <p className="text-sm text-yellow-800">
//                 <strong>Note:</strong> {planData.modification_note}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Conversation Screen
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
//               <span className="text-white font-bold">{coachName[0]}</span>
//             </div>
//             <div>
//               <h2 className="font-semibold text-gray-900">{coachName}</h2>
//               <p className="text-xs text-gray-500">
//                 {stage || "Ready to help"} • {goalDescription}
//               </p>
//             </div>
//           </div>
//           <div className="flex gap-2">
//             {planData && (
//               <button
//                 onClick={() => setScreen("PLAN_SCREEN")}
//                 className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2"
//               >
//                 <Target className="w-4 h-4" />
//                 View Plan
//               </button>
//             )}
//             <button
//               onClick={newSession}
//               className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
//             >
//               <Plus className="w-4 h-4" />
//               New Session
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
//           {messages.map((msg, idx) => (
//             <div
//               key={idx}
//               className={`flex ${
//                 msg.role === "user" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-[70%] rounded-2xl px-4 py-3 ${
//                   msg.role === "user"
//                     ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
//                     : "bg-white shadow-md text-gray-900"
//                 }`}
//               >
//                 <p className="text-sm leading-relaxed whitespace-pre-wrap">
//                   {msg.content}
//                 </p>
//               </div>
//             </div>
//           ))}
//           {loading && (
//             <div className="flex justify-start">
//               <div className="bg-white shadow-md rounded-2xl px-4 py-3">
//                 <div className="flex gap-1">
//                   <div
//                     className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                     style={{ animationDelay: "0ms" }}
//                   ></div>
//                   <div
//                     className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                     style={{ animationDelay: "150ms" }}
//                   ></div>
//                   <div
//                     className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                     style={{ animationDelay: "300ms" }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>
//       </div>

//       {/* Input */}
//       <div className="bg-white border-t shadow-lg">
//         <div className="max-w-4xl mx-auto px-6 py-4">
//           <div className="flex gap-3">
//             <input
//               type="text"
//               value={inputMessage}
//               onChange={(e) => setInputMessage(e.target.value)}
//               onKeyPress={handleKeyPress}
//               placeholder="Type your message..."
//               disabled={loading}
//               className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
//             />
//             <button
//               onClick={sendMessage}
//               disabled={loading || !inputMessage.trim()}
//               className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               <Send className="w-4 h-4" />
//               Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Plus,
  Target,
  MessageSquare,
  CheckCircle2,
  Clock,
  LogOut,
  User,
  List,
  Edit2,
  Check,
  X,
} from "lucide-react";

const API_URL = "http://localhost:8000/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [screen, setScreen] = useState("LOGIN"); // LOGIN, REGISTER, GOALS_LIST, GOAL_CREATE, CONVERSATION, PLAN_SCREEN

  // Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Goals
  const [goals, setGoals] = useState([]);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [coachName, setCoachName] = useState("Alex");
  const [goalDescription, setGoalDescription] = useState("");

  // Chat
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Plan
  const [planData, setPlanData] = useState(null);
  const [tweakDialogOpen, setTweakDialogOpen] = useState(false);
  const [tweakMessage, setTweakMessage] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Supabase email confirmation callback
  useEffect(() => {
    const handleAuthCallback = () => {
      // Check if URL has hash with access_token (Supabase email confirmation redirect)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Parse the hash fragment
        const params = new URLSearchParams(hash.substring(1)); // Remove the # character
        const accessToken = params.get("access_token");
        const type = params.get("type");

        if (accessToken) {
          // Store the token
          setToken(accessToken);
          localStorage.setItem("token", accessToken);

          // Try to decode user info from JWT (basic decode, not verification)
          try {
            const payload = JSON.parse(atob(accessToken.split(".")[1]));
            const userData = {
              id: payload.sub,
              email: payload.email,
            };
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (e) {
            console.error("Failed to decode token:", e);
          }

          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);

          // Show success message for email confirmation
          if (type === "signup") {
            alert("Email confirmed successfully! Welcome to AI Coach.");
          }

          // Navigate to goals and fetch them
          setScreen("GOALS_LIST");
          // Fetch goals after a short delay to ensure state is updated
          setTimeout(() => {
            fetchGoals();
          }, 100);
        }
      }
    };

    handleAuthCallback();
  }, []);

  useEffect(() => {
    if (token && screen === "LOGIN") {
      setScreen("GOALS_LIST");
      fetchGoals();
    }
  }, [token]);

  // Auth Functions
  const handleRegister = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is an email confirmation message (not a real error)
        if (data.detail && data.detail.includes("check your email")) {
          alert("Registration successful! Please check your email to confirm your account, then click the link to continue.");
          setScreen("LOGIN"); // Go back to login so they can login after confirming
          return;
        }
        alert(data.detail || "Registration failed");
        return;
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setScreen("GOALS_LIST");
      fetchGoals();
    } catch (error) {
      alert("Registration failed: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.detail || "Login failed");
        return;
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setScreen("GOALS_LIST");
      fetchGoals();
    } catch (error) {
      alert("Login failed: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setScreen("LOGIN");
    setGoals([]);
    setCurrentGoal(null);
    setMessages([]);
  };

  // Goals Functions
  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_URL}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  const createGoal = async () => {
    if (!goalDescription.trim()) {
      alert("Please enter your goal!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coach_name: coachName,
          goal_description: goalDescription,
        }),
      });

      const data = await response.json();
      setCurrentGoal(data);
      await loadChat(data.id);
      setScreen("CONVERSATION");
    } catch (error) {
      alert("Failed to create goal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openGoal = async (goal) => {
    setCurrentGoal(goal);
    await loadChat(goal.id);

    // Fetch full goal details to get plan
    try {
      const response = await fetch(`${API_URL}/goals/${goal.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.plan) {
        setPlanData(data.plan);
      }
    } catch (error) {
      console.error("Failed to fetch goal details:", error);
    }

    setScreen("CONVERSATION");
  };

  // Chat Functions
  const loadChat = async (goalId) => {
    try {
      const response = await fetch(`${API_URL}/goal/${goalId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(data.messages);
      setWelcomeMessage(data.welcome_message);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/goal/${currentGoal.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          created_at: new Date().toISOString(),
        },
      ]);

      // Update current goal status
      setCurrentGoal((prev) => ({ ...prev, status: data.stage }));

      // Handle screen changes
      if (data.flag === "PLAN_SCREEN" && data.plan_data) {
        setPlanData(data.plan_data);
        setScreen("PLAN_SCREEN");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong: " + error.message,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Plan Functions
  const acceptPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/goal/${currentGoal.id}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      alert(data.message);
      setCurrentGoal((prev) => ({ ...prev, status: data.status }));
      setPlanData((prev) => ({ ...prev, status: "accepted" }));
    } catch (error) {
      alert("Failed to accept plan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStepCompletion = async (stepId, currentCompleted) => {
    try {
      const response = await fetch(
        `${API_URL}/goal/${currentGoal.id}/step/${stepId}/completion`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            step_id: stepId,
            completed: !currentCompleted,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update step");
      }

      const data = await response.json();
      
      // Update local plan data
      setPlanData((prev) => {
        const updatedSteps = prev.steps.map((step) =>
          step.id === stepId
            ? { ...step, completed: !currentCompleted }
            : step
        );
        return { ...prev, steps: updatedSteps };
      });
    } catch (error) {
      alert("Failed to update step: " + error.message);
    }
  };

  const tweakPlan = async () => {
    if (!tweakMessage.trim()) return;

    setLoading(true);
    try {
      // Filter out completed steps - only send remaining steps for tweaking
      const remainingSteps = planData.steps.filter(
        (step) => !step.completed
      );

      const response = await fetch(`${API_URL}/goal/${currentGoal.id}/tweak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tweak_message: tweakMessage,
          remaining_steps: remainingSteps,
        }),
      });

      const data = await response.json();
      setPlanData(data.plan);
      setTweakDialogOpen(false);
      setTweakMessage("");
      alert(data.message);
    } catch (error) {
      alert("Failed to tweak plan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const completeGoal = async () => {
    if (!confirm("Mark this goal as completed?")) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/goal/${currentGoal.id}/complete`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      alert(data.message);
      setCurrentGoal((prev) => ({ ...prev, status: data.status }));
    } catch (error) {
      alert("Failed to complete goal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const backToChat = () => {
    setScreen("CONVERSATION");
  };

  const backToGoals = () => {
    setScreen("GOALS_LIST");
    setCurrentGoal(null);
    setMessages([]);
    setPlanData(null);
    fetchGoals();
  };

  // Login Screen
  if (screen === "LOGIN" || screen === "REGISTER") {
    const isLogin = screen === "LOGIN";

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
            <p className="text-gray-600">
              {isLogin ? "Welcome back!" : "Create your account"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (isLogin ? handleLogin() : handleRegister())
                }
              />
            </div>

            <button
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
            >
              {authLoading ? "Loading..." : isLogin ? "Login" : "Register"}
            </button>

            <button
              onClick={() => setScreen(isLogin ? "REGISTER" : "LOGIN")}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Goals List Screen
  if (screen === "GOALS_LIST") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Create Goal Button */}
          <button
            onClick={() => {
              setGoalDescription("");
              setCoachName("Alex");
              setScreen("GOAL_CREATE");
            }}
            className="w-full mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Goal
          </button>

          {/* Goals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No goals yet. Create your first goal to get started!</p>
              </div>
            ) : (
              goals?.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => openGoal(goal)}
                  className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {goal.coach_name[0]}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        goal.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : goal.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : goal.status === "pending_acceptance"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {goal.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {goal.goal_description}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Coach: {goal.coach_name}
                  </p>
                  {goal.has_plan && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Step {goal.current_step}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Goal Create Screen
  if (screen === "GOAL_CREATE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Goal
            </h1>
            <p className="text-gray-600">
              Let's achieve something amazing together
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coach Name
              </label>
              <input
                type="text"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Alex"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your goal?
              </label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                placeholder="e.g., learn piano, get fit, start a business..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={backToGoals}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createGoal}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Start Coaching"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Plan Screen
  if (screen === "PLAN_SCREEN" && planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {planData.title}
                </h1>
                <p className="text-gray-600 mt-1">
                  Coach: {currentGoal.coach_name}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={backToChat}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={backToGoals}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  Goals
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentGoal.current_step} / {planData.total_steps} steps
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{currentGoal.goal_description}</span>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  planData.status === "accepted"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {planData.status}
              </span>
            </div>

            {planData.status === "pending_acceptance" && (
              <div className="flex gap-3">
                <button
                  onClick={acceptPlan}
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Accept Plan
                </button>
                <button
                  onClick={() => setTweakDialogOpen(true)}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Tweak Plan
                </button>
              </div>
            )}

            {planData.status === "accepted" &&
              currentGoal.status !== "completed" && (
                <button
                  onClick={completeGoal}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Mark Goal as Completed
                </button>
              )}
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {planData.steps.map((step, index) => (
              <div
                key={step.id}
                className={`bg-white rounded-xl shadow p-6 transition-all ${
                  index === currentGoal.current_step
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : step.completed
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={step.completed || false}
                      onChange={() => toggleStepCompletion(step.id, step.completed || false)}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                    />
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step.completed
                          ? "bg-green-100 text-green-600"
                          : index === currentGoal.current_step
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {step.completed ? "✓" : step.id}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-1 ${
                      step.completed ? "text-gray-500 line-through" : "text-gray-900"
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`mb-2 ${step.completed ? "text-gray-400" : "text-gray-600"}`}>
                      {step.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{step.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {planData.modification_note && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> {planData.modification_note}
              </p>
            </div>
          )}
        </div>

        {/* Tweak Dialog */}
        {tweakDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Tweak Your Plan</h3>
                <button
                  onClick={() => setTweakDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <textarea
                value={tweakMessage}
                onChange={(e) => setTweakMessage(e.target.value)}
                placeholder="e.g., Make it more challenging, add more practice time, adjust the remaining steps..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none mb-4"
                rows="4"
              />
              <p className="text-xs text-gray-500 mb-4">
                Note: Only unchecked (remaining) steps will be modified. Completed steps will be preserved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTweakDialogOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={tweakPlan}
                  disabled={loading || !tweakMessage.trim()}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  {loading ? "Tweaking..." : "Apply Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Conversation Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {currentGoal?.coach_name[0]}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {currentGoal?.coach_name}
              </h2>
              <p className="text-xs text-gray-500">
                {currentGoal?.status.replace("_", " ")} •{" "}
                {currentGoal?.goal_description}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {planData && (
              <button
                onClick={() => setScreen("PLAN_SCREEN")}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                View Plan
              </button>
            )}
            <button
              onClick={backToGoals}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              All Goals
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          {/* Welcome Message */}
          {welcomeMessage && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-200">
                <p className="text-sm leading-relaxed text-gray-900">
                  {welcomeMessage}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-white shadow-md text-gray-900"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
