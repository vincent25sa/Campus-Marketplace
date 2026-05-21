import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { searchListings } from "../services/api";
import ListingCard from "../components/ListingCard";

const Home = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchListings = async (searchTerm = "") => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchListings(searchTerm);
      const filtered = !searchTerm && user
        ? result.filter((listing) => Number(listing.user_id) !== Number(user.id))
        : result;
      setListings(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchListings(query);
  };

  const handleListingDeleted = () => {
    fetchListings(query);
  };

  return (
    <section className="section-card">
      <div>
        <h1 className="page-title">Search Campus Listings</h1>
        <p className="page-copy">
          Browse campus listings and contact sellers directly from the app.
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSearch}>
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or description"
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="alert">Loading listings…</div>}
      {!loading && listings.length === 0 && <div className="alert">No listings found.</div>}

      <div className="listing-grid">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} onSuccess={handleListingDeleted} />
        ))}
      </div>
    </section>
  );
};

export default Home;
