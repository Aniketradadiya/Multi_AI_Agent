import { useEffect, useState } from "react";
import { Settings, Shield, Mail, CheckCircle2, User as UserIcon } from "lucide-react";
import { api } from "../../services/api";

export function AdminSettingsPage() {
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [platformName, setPlatformName] = useState("Career Orbit");
  const [supportEmail, setSupportEmail] = useState("support@careerorbit.com");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then((res) => {
        const { adminProfile, platform } = res.data;
        if (adminProfile) {
          setAdminName(adminProfile.name || "");
          setAdminEmail(adminProfile.email || "");
        }
        if (platform) {
          setPlatformName(platform.platformName || "Career Orbit");
          setSupportEmail(platform.supportEmail || "support@careerorbit.com");
        }
      })
      .catch((err) => console.error("Error loading settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedAlert(false);
    try {
      await api.put("/admin/settings", {
        adminName,
        platformName,
        supportEmail,
      });

      // Update local storage user if changed
      const localUser = localStorage.getItem("user");
      if (localUser) {
        const parsed = JSON.parse(localUser);
        parsed.name = adminName;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner" />
        <p>Loading administrator configurations...</p>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Platform Settings</h2>
          <p className="admin-page-sub">Manage administrator profile and platform identity.</p>
        </div>
      </div>

      {savedAlert && (
        <div className="admin-toast-alert">
          <CheckCircle2 size={16} />
          <span>Platform settings updated successfully.</span>
          <button onClick={() => setSavedAlert(false)}>&times;</button>
        </div>
      )}

      <form onSubmit={handleSave} className="admin-settings-form">
        {/* Admin Profile Box */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Admin Profile</h3>
              <p className="admin-card-sub">Your personal administrator credentials</p>
            </div>
            <div className="admin-badge-subtle">
              <Shield size={14} /> Super Admin
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="setting-field">
              <label>
                <UserIcon size={14} /> Administrator Full Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </div>

            <div className="setting-field">
              <label>
                <Mail size={14} /> Account Email
              </label>
              <input
                type="email"
                value={adminEmail}
                disabled
                style={{ opacity: 0.7, cursor: "not-allowed", background: "#f5f8f5" }}
              />
              <span className="field-hint">Email is linked to authentication credentials</span>
            </div>
          </div>
        </div>

        {/* Platform Identity Box */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Platform Details</h3>
              <p className="admin-card-sub">Public branding and contact channels</p>
            </div>
            <div className="admin-badge-subtle">
              <Settings size={14} /> Career Orbit
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="setting-field">
              <label>Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                required
              />
            </div>

            <div className="setting-field">
              <label>Official Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="settings-action-row">
          <button type="submit" className="primary admin-save-btn" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Platform Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
