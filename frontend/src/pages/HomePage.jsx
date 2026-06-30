import { useMemo, useState } from "react";
import Logo from "../components/Logo";
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
      <aside className="dashboard-sidebar" aria-label="Main navigation">
        <div className="sidebar-logo-lockup">
          <Logo />
          <div>
            <strong>FIMA</strong>
            <span>Finance OS</span>
          </div>
        </div>
        <nav className="dashboard-nav">
          {MODULES.map((module) => (
            <button
              key={module.title}
              className={`dashboard-nav-item ${module.title === "Inventory" ? "active" : ""}`}
              type="button"
              onClick={module.title === "Inventory" ? onOpenInventory : undefined}
            >
              <span>{module.title.slice(0, 1)}</span>
              {module.title}
            </button>
          ))}
        </nav>
        <div className="sidebar-mini-card">
          <img src="/image-4.png" alt="" loading="lazy" />
          <p>Smart Finance Management</p>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="home-header">
          <div className="home-title">
            <div>
              <p className="eyebrow">Fima command center</p>
              <h1>Welcome to FIMA</h1>
              <p className="subtext">
                Pick a module to continue building your operations view.
              </p>
            </div>
          </div>
          <div className="dashboard-search" role="search">
            <span aria-hidden="true">Search</span>
            <input type="search" placeholder="Search modules, reports, insights" aria-label="Search dashboard" />
          </div>
          <ProfileMenu company={company} onLogout={onLogout} />
        </header>

        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="eyebrow">Private finance intelligence</p>
            <h2>Command your cash flow with calm precision</h2>
            <p>
              A polished operating space for inventory, sales, production, and
              financial decisions, shaped around your live business data.
            </p>
          </div>
          <div className="home-hero-showcase">
            <div className="home-hero-panel">
              <img src="/image-1.jpg" alt="" />
            </div>
            <div className="module-button-row hero-module-buttons" aria-label="Business modules">
              {MODULES.map((module) => (
                <article
                  key={module.title}
                  className="module-pill-button"
                >
                  <span>{module.title}</span>
                  <small>{module.description}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-trust-strip" aria-label="Finance workspace highlights">
          <div>
            <span>01</span>
            <strong>Operations</strong>
            <p>Inventory and supplier clarity</p>
          </div>
          <div>
            <span>02</span>
            <strong>Growth</strong>
            <p>Sales and demand signals</p>
          </div>
          <div>
            <span>03</span>
            <strong>Control</strong>
            <p>Production and finance flow</p>
          </div>
        </section>

        <section className="home-insight">
          <div className="insight-visual">
            <img src="/image-3.jpg" alt="" loading="lazy" />
          </div>
          <div className="insight-copy">
            <p className="eyebrow">Designed for growing businesses</p>
            <h3>Every module stays connected to the decisions that move money.</h3>
            <p className="muted">
              Keep your stock, suppliers, production, and sales signals in one
              place while the assistant helps you reason through the next move.
            </p>
          </div>
        </section>

        <section className="chat-panel">
          <div className="chat-visual">
            <img src="/image-2.png" alt="" loading="lazy" />
          </div>
          <div className="chat-content">
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
          </div>
        </section>
      </main>
    </div>
  );
}
