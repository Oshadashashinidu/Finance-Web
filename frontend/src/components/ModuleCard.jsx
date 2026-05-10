export default function ModuleCard({ title, description, onClick }) {
  return (
    <button className="module-card" type="button" onClick={onClick}>
      <h3>{title}</h3>
      <p>{description}</p>
    </button>
  );
}
