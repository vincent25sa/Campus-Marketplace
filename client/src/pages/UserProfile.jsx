import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserProfile } from "../services/api";

const UserProfile = () => {
  const { user_id } = useParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getUserProfile(user_id);
        setProfile(res.user);
        setListings(res.listings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user_id]);

  if (loading) return <div className="alert">Loading profile…</div>;
  if (error) return <div className="alert error">{error}</div>;
  if (!profile) return <div className="alert">User not found.</div>;

  return (
    <section className="section-card">
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div>
          {profile.profile_image ? (
            <img src={profile.profile_image} alt={`${profile.name} ${profile.surname}`} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }} />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              No Image
            </div>
          )}
        </div>
        <div>
          <h1 className="page-title">{profile.name} {profile.surname}</h1>
          <p className="page-copy">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
          <p className="page-copy">Contact: {profile.email}</p>
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Listings by {profile.name}</h2>
      <div className="listing-grid">
        {listings.length === 0 && <div className="alert">No listings yet.</div>}
        {listings.map((l) => (
          <div key={l.id} className="listing-card">
            {l.image && <img className="listing-image" src={l.image} alt={l.title} />}
            <div className="listing-content">
              <h3 className="listing-title">{l.title}</h3>
              <div className="listing-meta">
                <span>{l.location}</span>
                <span>R{Number(l.price).toFixed(2)}</span>
              </div>
              <Link to={`/listings/${l.id}`} className="button">View listing</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UserProfile;
