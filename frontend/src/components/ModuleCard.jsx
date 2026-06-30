const CARD_IMAGES = {
  Inventory: "/inventory.png",
  Production: "/inventory.png",
  Sales: "/inventory.png",
  Financials: "/inventory.png"
};

export default function ModuleCard({ title, description, onClick }) {
  const imageSrc = CARD_IMAGES[title] || "/inventory.png";

  return (
    <button className="module-card" type="button" onClick={onClick}>
      <div className="module-card-media">
        <img src={imageSrc} alt="" loading="lazy" />
      </div>
      <div className="module-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="module-card-action">Open module</span>
      </div>
    </button>
  );
}
