export default function ProfileMenu({ company, onLogout }) {
  const initials = (name) => {
    if (!name) {
      return "CO";
    }

    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return `${first}${second}`.toUpperCase() || "CO";
  };

  return (
    <div className="profile">
      <div className="profile-avatar" aria-hidden="true">
        {initials(company?.companyName)}
      </div>
      <div className="profile-details">
        <p className="profile-name">{company?.companyName || "Company"}</p>
        <p className="profile-email">{company?.companyEmail || ""}</p>
      </div>
      <button className="ghost" type="button" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
