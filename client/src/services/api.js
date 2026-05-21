const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }
    return data;
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || "Server error");
  }
  try {
    return JSON.parse(text);
  } catch (parseErr) {
    throw new Error("Unexpected server response: " + text.slice(0, 200));
  }
};

export const register = async ({ name, surname, email, password }) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, surname, email, password })
  });
  return handleResponse(response);
};

export const login = async ({ email, password }) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(response);
};

export const requestPasswordReset = async ({ email, newPassword }) => {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword })
  });
  return handleResponse(response);
};

export const resetPassword = async ({ resetToken, newPassword }) => {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetToken, newPassword })
  });
  return handleResponse(response);
};

export const updateProfile = async ({ user_id, name, email, password }) => {
  const response = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, name, email, password })
  });
  return handleResponse(response);
};

export const uploadProfilePicture = async ({ user_id, file }) => {
  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("profile_image", file);

  const response = await fetch("/api/auth/profile-picture", {
    method: "POST",
    body: formData
  });
  return handleResponse(response);
};

export const getUserProfile = async (user_id) => {
  const response = await fetch(`/api/users/${encodeURIComponent(user_id)}`);
  return handleResponse(response);
};

export const deleteAccount = async ({ user_id }) => {
  const response = await fetch("/api/auth/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id })
  });
  return handleResponse(response);
};

export const searchListings = async (query) => {
  const url = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
  const response = await fetch(url);
  return handleResponse(response);
};

export const createListing = async ({ user_id, title, description, price, location, imageFile }) => {
  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("location", location);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch("/api/listings", {
    method: "POST",
    body: formData
  });
  return handleResponse(response);
};

export const sendMessage = async ({ sender_id, receiver_id, message, reply_to, item_id }) => {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender_id, receiver_id, message, reply_to: reply_to || null, item_id: item_id || null })
  });
  return handleResponse(response);
};

export const getMessages = async (user_id) => {
  const response = await fetch(`/api/messages?user_id=${user_id}`);
  return handleResponse(response);
};

export const editMessage = async ({ message_id, user_id, message }) => {
  const response = await fetch(`/api/messages/${message_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, message })
  });
  return handleResponse(response);
};

export const deleteMessage = async (message_id, user_id) => {
  const response = await fetch(`/api/messages/${message_id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id })
  });
  return handleResponse(response);
};

export const editListing = async ({ listing_id, user_id, title, description, price, location, imageFile }) => {
  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("location", location);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch(`/api/listings/${listing_id}`, {
    method: "PUT",
    body: formData
  });
  return handleResponse(response);
};

export const deleteListing = async (listing_id, user_id) => {
  const response = await fetch(`/api/listings/${listing_id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id })
  });
  return handleResponse(response);
};

export const getAdminUsers = async (user_id, start_date, end_date) => {
  const params = new URLSearchParams({ user_id });
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const response = await fetch(`/api/admin/users?${params.toString()}`);
  return handleResponse(response);
};

export const getAdminListings = async (user_id, start_date, end_date) => {
  const params = new URLSearchParams({ user_id });
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const response = await fetch(`/api/admin/listings?${params.toString()}`);
  return handleResponse(response);
};

export const getAdminMessages = async (user_id, start_date, end_date) => {
  const params = new URLSearchParams({ user_id });
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const response = await fetch(`/api/admin/messages?${params.toString()}`);
  return handleResponse(response);
};

export const downloadUsersReport = async (user_id, start_date, end_date, format = "pdf") => {
  const requestedFormat = String(format || "pdf").trim().toLowerCase();
  const params = new URLSearchParams({ user_id, format: requestedFormat });
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const response = await fetch(`/api/admin/users-report?${params.toString()}`);
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const errorText = contentType.includes("application/json") ? await response.json().then((data) => data.error || JSON.stringify(data)).catch(() => null) : await response.text().catch(() => null);
    throw new Error(errorText || "Failed to download report.");
  }
  return response.blob();
};

export const downloadListingsReport = async (user_id, start_date, end_date, format = "pdf") => {
  const requestedFormat = String(format || "pdf").trim().toLowerCase();
  const params = new URLSearchParams({ user_id, format: requestedFormat });
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const response = await fetch(`/api/admin/listings-report?${params.toString()}`);
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const errorText = contentType.includes("application/json") ? await response.json().then((data) => data.error || JSON.stringify(data)).catch(() => null) : await response.text().catch(() => null);
    throw new Error(errorText || "Failed to download report.");
  }
  return response.blob();
};

export const downloadMessagesReport = async (user_id, start_date, end_date, format = "pdf") => {
  const requestedFormat = String(format || "pdf").trim().toLowerCase();
  const params = new URLSearchParams({ user_id, format: requestedFormat });
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const response = await fetch(`/api/admin/messages-report?${params.toString()}`);
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const errorText = contentType.includes("application/json") ? await response.json().then((data) => data.error || JSON.stringify(data)).catch(() => null) : await response.text().catch(() => null);
    throw new Error(errorText || "Failed to download report.");
  }
  return response.blob();
};
