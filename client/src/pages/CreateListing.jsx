import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListing } from "../services/api";
import { useAuth } from "../context/AuthContext";

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      await createListing({
        user_id: user.id,
        title,
        description,
        price: parseFloat(price),
        location,
        imageFile
      });
      setSuccess("Listing created successfully.");
      setTitle("");
      setDescription("");
      setPrice("");
      setLocation("");
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-card">
      <h1 className="page-title">Create a New Listing</h1>
      <p className="page-copy">Submit details for your item and make it visible on the marketplace.</p>

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
          {submitting ? "Creating Listing…" : "Create Listing"}
        </button>
      </form>
    </section>
  );
};

export default CreateListing;
