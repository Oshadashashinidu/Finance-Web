import Logo from "../components/Logo";
import ModuleCard from "../components/ModuleCard";
import ProfileMenu from "../components/ProfileMenu";

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
  return (
    <div className="home">
      <header className="home-header">
        <div className="home-title">
          <Logo />
          <div>
            <p className="eyebrow">Fima</p>
            <h1>Welcome to your finance hub</h1>
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
    </div>
  );
}
