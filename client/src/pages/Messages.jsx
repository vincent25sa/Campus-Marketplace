import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMessages, sendMessage, editMessage, deleteMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [openMenuMessageId, setOpenMenuMessageId] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMessages(user.id);
      setMessages(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) {
      return;
    }

    setSendingReply(true);
    setError(null);

    try {
      await sendMessage({
        sender_id: user.id,
        receiver_id: selectedConversation,
        message: replyText.trim(),
        reply_to: replyToMessage?.id,
        item_id: replyToMessage?.item_id || null,
      });
      setReplyText("");
      setReplyToMessage(null);
      fetchMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleReplyTo = (msg) => {
    setReplyToMessage(msg);
    closeMenu();
  };

  const cancelReply = () => {
    setReplyToMessage(null);
    setReplyText("");
  };

  const canEditMessage = (msg) => {
    if (msg.sender_id !== user.id) return false;
    const ageMs = Date.now() - new Date(msg.created_at).getTime();
    return ageMs <= 15 * 60 * 1000;
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const toggleMenu = (messageId) => {
    setOpenMenuMessageId((current) => (current === messageId ? null : messageId));
  };

  const closeMenu = () => {
    setOpenMenuMessageId(null);
  };

  const startEditing = (msg) => {
    closeMenu();
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
  };

  const saveEditedMessage = async () => {
    if (!editingText.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await editMessage({ message_id: editingMessageId, user_id: user.id, message: editingText.trim() });
      setEditingMessageId(null);
      setEditingText("");
      fetchMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message for everyone?")) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await deleteMessage(messageId, user.id);
      if (editingMessageId === messageId) {
        cancelEditing();
      }
      fetchMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Group messages by conversation
  const conversations = {};
  messages.forEach((msg) => {
    const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    const otherUserName = msg.sender_id === user.id ? msg.receiver_name : msg.sender_name;
    const key = otherUserId;

    if (!conversations[key]) {
      conversations[key] = {
        userId: otherUserId,
        name: otherUserName || `User #${otherUserId}`,
        messages: []
      };
    }
    conversations[key].messages.push(msg);
  });

  const conversationList = Object.values(conversations).sort(
    (a, b) => new Date(b.messages[0]?.created_at) - new Date(a.messages[0]?.created_at)
  );

  const currentConversation = selectedConversation 
    ? conversations[selectedConversation]
    : null;

  return (
    <section className="section-card">
      <h1 className="page-title">Messages</h1>
      <p className="page-copy">View all your conversations with buyers and sellers.</p>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="alert">Loading messages…</div>}

      {!loading && messages.length === 0 && (
        <div className="alert">No messages yet.</div>
      )}

      {!loading && messages.length > 0 && (
        <div className="messages-container">
          {/* Conversations List */}
          <div className="conversations-list">
            <h2 className="conversations-title">Conversations</h2>
            {conversationList.map((conversation) => {
              const lastMessage = conversation.messages[0];
              const isSelected = selectedConversation === conversation.userId;
              const otherAvatar = lastMessage.sender_id === user.id ? lastMessage.receiver_profile_image : lastMessage.sender_profile_image;
              return (
                <button
                  key={conversation.userId}
                  className={`conversation-item ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedConversation(conversation.userId)}
                >
                  <div className="conversation-header">
                    {otherAvatar ? (
                      <Link to={`/users/${conversation.userId}`} className="conversation-avatar-link">
                        <img src={otherAvatar} alt={conversation.name} className="conversation-avatar" />
                      </Link>
                    ) : null}
                    <div style={{ flex: 1 }}>
                      <h3 className="conversation-name">{conversation.name}</h3>
                      <span className="conversation-time">
                        {new Date(lastMessage.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="conversation-preview">
                    {lastMessage.sender_id === user.id ? "You: " : ""}{lastMessage.message.substring(0, 40)}...
                  </p>
                </button>
              );
            })}
          </div>

          {/* Messages Thread */}
          {currentConversation ? (
            <div className="messages-thread">
              <div className="thread-header">
                <h2>{currentConversation.name}</h2>
                <p>Total messages: {currentConversation.messages.length}</p>
              </div>
              <div className="messages-list">
                {[...currentConversation.messages].reverse().map((msg) => {
                  const avatarSrc = msg.sender_profile_image || (msg.sender_id === user.id ? user.profile_image : null);
                  return (
                    <div
                      key={msg.id}
                      className={`message ${msg.sender_id === user.id ? "sent" : "received"}`}
                    >
                      {avatarSrc ? (
                        <Link to={`/users/${msg.sender_id}`} className="message-avatar-link">
                          <img src={avatarSrc} alt={msg.sender_name || "User"} className="message-avatar" />
                        </Link>
                      ) : null}
                      <div className="message-content">
                        {editingMessageId === msg.id ? (
                          <>
                            <textarea
                              className="textarea"
                              rows={3}
                              value={editingText}
                              onChange={(event) => setEditingText(event.target.value)}
                            />
                            <div className="message-action-row">
                              <button
                                className="small-button"
                                type="button"
                                onClick={saveEditedMessage}
                                disabled={actionLoading || !editingText.trim()}
                              >
                                Save
                              </button>
                              <button
                                className="small-button"
                                type="button"
                                onClick={cancelEditing}
                                disabled={actionLoading}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {msg.item_id && (
                              <div className="message-item-reference" style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                                {msg.item_image && (
                                  <img src={msg.item_image} alt={msg.item_title || "Item"} style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 4 }} />
                                )}
                                <div>
                                  <strong style={{ display: "block" }}>{msg.item_title || "Item"}</strong>
                                  {msg.item_price && <span>R{Number(msg.item_price).toFixed(2)}</span>}
                                </div>
                              </div>
                            )}
                            <p className="message-text">{msg.message}</p>
                            <span className="message-time">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                      {editingMessageId !== msg.id && (
                        <div className="message-actions-menu">
                          <button
                            className="menu-toggle-button"
                            type="button"
                            onClick={() => toggleMenu(msg.id)}
                          >
                            •••
                          </button>
                          {openMenuMessageId === msg.id && (
                            <div className="menu-options">
                              <button
                                className="menu-option"
                                type="button"
                                onClick={() => handleReplyTo(msg)}
                              >
                                Reply
                              </button>
                              {canEditMessage(msg) && (
                                <button
                                  className="menu-option"
                                  type="button"
                                  onClick={() => startEditing(msg)}
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                className="menu-option"
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                disabled={actionLoading}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="message-reply-box" style={{ marginTop: "16px" }}>
                {replyToMessage && (
                  <div className="reply-preview-box">
                    <span>Replying to {replyToMessage.sender_name || "User"}:</span>
                    <p>{replyToMessage.message}</p>
                    <button className="reply-cancel-button" type="button" onClick={cancelReply}>
                      Cancel
                    </button>
                  </div>
                )}
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                />
                <button
                  className="button"
                  type="button"
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  style={{ marginTop: "8px" }}
                >
                  {sendingReply ? "Sending reply..." : "Send Reply"}
                </button>
              </div>
            </div>
          ) : (
            <div className="messages-thread-empty">
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Messages;
