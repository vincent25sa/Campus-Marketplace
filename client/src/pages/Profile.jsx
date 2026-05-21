import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import { updateProfile, deleteAccount } from "../services/api";
import { uploadProfilePicture, getUserProfile } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, logout, loginUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_image || null);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getUserProfile(user.id);
        if (mounted) {
          setProfileImage(res.user.profile_image || null);
          setListings(res.listings || []);
        }
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!name && !email && !password) {
      setError("Please fill in at least one field to update.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateProfile({
        user_id: user.id,
        name: name || undefined,
        email: email || undefined,
        password: password || undefined
      });

      setSuccess("Profile updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfilePicture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const res = await uploadProfilePicture({ user_id: user.id, file });
      setSuccess("Profile image updated.");
      setProfileImage(res.profile_image || null);
      // update stored user in context/localStorage
      loginUser({ ...user, profile_image: res.profile_image || null });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const loadUserListings = async () => {
    try {
      const res = await getUserProfile(user.id);
      setListings(res.listings || []);
    } catch (err) {
      // ignore
    }
  };
  const handleDeleteAccount = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await deleteAccount({ user_id: user.id });
      setSuccess("Account deleted successfully. Logging out...");
      setTimeout(() => {
        logout();
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <section className="section-card">
      <h1 className="page-title">Profile Settings</h1>
      <p className="page-copy">Manage your account details and preferences.</p>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <form className="form-grid" onSubmit={handleUpdateProfile}>
        <h2>Edit Profile</h2>
        <label>Profile picture</label>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          {profileImage ? (
            <img src={profileImage} alt="profile" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No Image</div>
          )}
          <input type="file" accept="image/*" onChange={handleProfilePicture} />
        </div>
        <input
          className="input"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="New Password (leave blank if not changing)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Updating..." : "Update Profile"}
        </button>
      </form>

      <div className="form-grid" style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #ccc" }}>
        <h2>Your Listings</h2>
        {listings.length === 0 ? (
          <div className="alert">You have no active listings yet.</div>
        ) : (
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{ ...listing, user_id: user.id }}
                showOwnerActions={true}
                onSuccess={loadUserListings}
              />
            ))}
          </div>
        )}
      </div>

      <div className="form-grid" style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #ccc" }}>
        <h2>Delete Account</h2>
        <p className="page-copy">Permanently delete your account and all associated data.</p>
        
        {!showDeleteConfirm ? (
          <button 
            className="button" 
            type="button" 
            onClick={() => setShowDeleteConfirm(true)}
            style={{ backgroundColor: "#d32f2f", color: "white" }}
          >
            Delete Account
          </button>
        ) : (
          <div>
            <p style={{ color: "red", fontWeight: "bold" }}>
              Are you sure? This action cannot be undone. All your listings and messages will be deleted.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className="button" 
                type="button" 
                onClick={handleDeleteAccount}
                disabled={submitting}
                style={{ backgroundColor: "#d32f2f", color: "white" }}
              >
                {submitting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button 
                className="button" 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={submitting}
                style={{ backgroundColor: "#666" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;
