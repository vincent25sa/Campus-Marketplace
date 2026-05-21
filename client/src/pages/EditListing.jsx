import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { editListing } from "../services/api";
import { useAuth } from "../context/AuthContext";

const EditListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listing_id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listing_id}`);
        if (!response.ok) {
          throw new Error("Failed to load listing");
        }
        const listing = await response.json();
        
        // Check if user owns the listing
        if (listing.user_id !== user.id) {
          setError("Unauthorized: You can only edit your own listings.");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        setTitle(listing.title);
        setDescription(listing.description || "");
        setPrice(listing.price);
        setLocation(listing.location);
        if (listing.image) {
          setImagePreview(listing.image);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listing_id, user.id, navigate]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await editListing({
        listing_id,
        user_id: user.id,
        title,
        description,
        price: parseFloat(price),
        location,
        imageFile
      });
      setSuccess("Listing updated successfully.");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <section className="section-card"><div className="alert">Loading listing...</div></section>;
  }

  return (
    <section className="section-card">
      <h1 className="page-title">Edit Listing</h1>
      <p className="page-copy">Update your listing details.</p>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <textarea
          className="textarea"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
        />
        <input
          className="input"
          type="number"
          placeholder="Price in rand (R)"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          min="0"
          step="0.01"
          required
        />
        <select
          className="input"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        >
          <option value="">Select a location</option>
          <option value="Corridor Hill">Corridor Hill</option>
          <option value="Khayalethu">Khayalethu</option>
          <option value="Building 54">Building 54</option>
          <option value="Private accommodation">Private accommodation</option>
        </select>
        <div>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" style={{ maxWidth: "200px", marginTop: "10px" }} />
            </div>
          )}
        </div>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Updating Listing…" : "Update Listing"}
        </button>
      </form>
    </section>
  );
};

export default EditListing;
