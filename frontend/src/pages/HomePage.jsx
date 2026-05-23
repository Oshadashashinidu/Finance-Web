import { useMemo, useState } from "react";
import Logo from "../components/Logo";
import ModuleCard from "../components/ModuleCard";
import ProfileMenu from "../components/ProfileMenu";
import { sendChatMessage } from "../api";

const MODULES = [
  {
    title: "Inventory",
    description: "Track materials, reorder levels, and stock intake."
  },
  {
    title: "Production",
    description: "Review recipes, material requirements, and costs."
  },
  {
    title: "Sales",
    description: "Monitor revenue streams and customer activity."
  },
  {
    title: "Financials",
    description: "Stay on top of accounts, transactions, and cash flow."
  }
];

export default function HomePage({ company, onLogout, onOpenInventory }) {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Ask me about market trends, pricing, or business insights."
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const canSend = useMemo(() => chatInput.trim().length > 0 && !chatLoading, [chatInput, chatLoading]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    const message = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const response = await sendChatMessage({
        message,
        history: chatMessages
      });
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.data.reply }]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: error.message || "Unable to answer right now." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-title">
          <Logo />
          <div>
            <p className="eyebrow">Fima</p>
            <h1>Welcome to FIMA</h1>
            <p className="subtext">
              Pick a module to continue building your operations view.
            </p>
          </div>
        </div>
        <ProfileMenu company={company} onLogout={onLogout} />
      </header>

      <main className="card-grid">
        {MODULES.map((module) => (
          <ModuleCard
            key={module.title}
            {...module}
            onClick={module.title === "Inventory" ? onOpenInventory : undefined}
          />
        ))}
      </main>

      <section className="chat-panel">
        <div className="chat-header">
          <div>
            <h3>Market assistant</h3>
            <p className="muted">Ask about trends, pricing, or demand shifts.</p>
          </div>
        </div>
        <div className="chat-messages">
          {chatMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`chat-bubble ${message.role}`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask about market updates..."
            aria-label="Chat message"
          />
          <button className="primary" type="submit" disabled={!canSend}>
            {chatLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}
