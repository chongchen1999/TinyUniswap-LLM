import React from "react";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatHistoryProps = {
  messages: Message[];
};

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  if (messages.length === 0) return null;

  return (
    <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6">
      <h2 className="text-2xl font-semibold mb-4">Conversation History</h2>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              message.role === "user" 
                ? "bg-primary text-primary-content ml-12" 
                : "bg-base-200 mr-12"
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {message.role === "user" ? "You" : "Assistant"}
            </p>
            <p className="whitespace-pre-line">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;