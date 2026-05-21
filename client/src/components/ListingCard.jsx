import { useAuth } from "../context/AuthContext";
import { sendMessage, deleteListing } from "../services/api";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ListingCard = ({ listing, onSuccess, showOwnerActions = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [status, setStatus] = useState(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const listingOwnerId = listing.user_id ?? listing.user?.id ?? listing.seller_id ?? listing.seller?.id;
  const isOwner = user && listingOwnerId !== undefined && Number(user.id) === Number(listingOwnerId);
  const ownerMode = isOwner || showOwnerActions;
  const showMessageControls = user && !ownerMode && listingOwnerId !== undefined;

  const handleSend = async () => {
    if (!messageText.trim()) {
      setStatus({ type: "error", text: "Please enter a message first." });
      return;
    }
    if (!user) {
      setStatus({ type: "error", text: "Login to send a message." });
      return;
    }
    if (isOwner || listingOwnerId === undefined) {
      setStatus({ type: "error", text: "You cannot message yourself." });
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      await sendMessage({
        sender_id: user.id,
        receiver_id: listingOwnerId,
        message: messageText.trim(),
        item_id: listing.id
      });
      setMessageText("");
      setStatus({ type: "success", text: "Message sent to seller." });
      setShowMessageForm(false);
      onSuccess?.();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteListing(listing.id, user.id);
      setStatus({ type: "success", text: "Listing deleted successfully." });
      setTimeout(() => onSuccess?.(), 1500);
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="listing-card">
      {listing.image && <img className="listing-image" src={listing.image} alt={listing.title} />}
      <div className="listing-content">
        <h2 className="listing-title">{listing.title}</h2>
        <div className="listing-meta">
          <span>{listing.description || "No description"}</span>
          <span>{listing.location}</span>
          <span>
            <Link to={`/users/${listingOwnerId}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
              {listing.seller_name || (listingOwnerId ? `User #${listingOwnerId}` : "Seller")}
            </Link>
          </span>
        </div>
        <div className="listing-price">R{Number(listing.price).toFixed(2)}</div>

        {ownerMode && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button 
              className="button" 
              type="button" 
              onClick={() => navigate(`/edit-listing/${listing.id}`)}
            >
              Edit
            </button>
            <button 
              className="button" 
              type="button" 
              onClick={handleDelete}
              disabled={deleting}
              style={{ backgroundColor: "#e74c3c" }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}

        {showMessageControls && (
          <>
            <button 
              className="button" 
              type="button" 
              onClick={() => setShowMessageForm(!showMessageForm)}
              style={{ marginBottom: "12px" }}
            >
              {showMessageForm ? "Hide" : "Message Seller"}
            </button>
            {showMessageForm && (
              <div className="listing-actions">
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => setMessageText(`Is the ${listing.title} still available?`)}
                  >
                    Ask if available
                  </button>
                </div>
                <textarea
                  className="textarea"
                  rows="3"
                  value={messageText}
                  placeholder="Send a message to the seller"
                  onChange={(event) => setMessageText(event.target.value)}
                />
                <button className="button" type="button" onClick={handleSend} disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            )}
          </>
        )}

        {status && <div className={`alert ${status.type}`} style={{ marginTop: "12px" }}>{status.text}</div>}
      </div>
    </article>
  );
};

export default ListingCard;
