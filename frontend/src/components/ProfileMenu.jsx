import { useState } from "react";

export default function ProfileMenu({ company, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="profile-menu">
      <button
        className="profile-trigger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="profile-avatar" aria-hidden="true">
          {initials(company?.companyName)}
        </div>
        <div className="profile-details">
          <p className="profile-name">{company?.companyName || "Company"}</p>
          <p className="profile-email">{company?.companyEmail || ""}</p>
        </div>
        <span className="profile-caret" aria-hidden="true">▾</span>
      </button>
      {isOpen ? (
        <div className="profile-popover" role="dialog" aria-label="Company profile">
          <div className="profile-popover-header">
            <div className="profile-avatar large" aria-hidden="true">
              {initials(company?.companyName)}
            </div>
            <div>
              <p className="profile-name">{company?.companyName || "Company"}</p>
              <p className="profile-email">{company?.companyEmail || ""}</p>
            </div>
          </div>
          <div className="profile-meta">
            <div>
              <span className="muted">Company ID</span>
              <strong>{company?.companyId || "-"}</strong>
            </div>
          </div>
          <button className="ghost" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
