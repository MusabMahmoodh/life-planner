import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Plus,
  Target,
  MessageSquare,
  CheckCircle2,
  Clock,
} from "lucide-react";

const API_URL = "http://localhost:8000/api";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [coachName, setCoachName] = useState("Alex");
  const [goalDescription, setGoalDescription] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("SETUP"); // SETUP, CONVERSATION, PLAN_SCREEN
  const [planData, setPlanData] = useState(null);
  const [stage, setStage] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createSession = async () => {
    if (!goalDescription.trim()) {
      alert("Please enter your goal!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coach_name: coachName,
          goal_description: goalDescription,
        }),
      });

      const data = await response.json();
      setSessionId(data.session_id);
      setMessages([{ role: "assistant", content: data.message }]);
      setScreen("CONVERSATION");
    } catch (error) {
      alert("Failed to create session: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          coach_name: coachName,
          goal_description: goalDescription,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      setStage(data.stage);

      // Handle screen changes
      if (data.flag === "PLAN_SCREEN" && data.plan_data) {
        setScreen("PLAN_SCREEN");
        setPlanData(data.plan_data);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong: " + error.message,
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

  const backToChat = () => {
    setScreen("CONVERSATION");
  };

  const newSession = () => {
    setSessionId(null);
    setMessages([]);
    setGoalDescription("");
    setPlanData(null);
    setScreen("SETUP");
    setStage("");
  };

  // Setup Screen
  if (screen === "SETUP") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
            <p className="text-gray-600">Let's achieve your goals together</p>
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

            <button
              onClick={createSession}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Session..." : "Start Coaching"}
            </button>
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
                  Coach: {planData.coach_name}
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
                  onClick={newSession}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {planData.current_step} / {planData.total_steps} steps
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{planData.goal}</span>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {planData.steps.map((step, index) => (
              <div
                key={step.id}
                className={`bg-white rounded-xl shadow p-6 transition-all ${
                  index === planData.current_step
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : step.completed
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step.completed
                        ? "bg-green-100 text-green-600"
                        : index === planData.current_step
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {step.completed ? "✓" : step.id}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{step.description}</p>
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
              <span className="text-white font-bold">{coachName[0]}</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{coachName}</h2>
              <p className="text-xs text-gray-500">
                {stage || "Ready to help"} • {goalDescription}
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
              onClick={newSession}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
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
