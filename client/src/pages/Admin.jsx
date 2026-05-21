import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAdminUsers,
  getAdminListings,
  getAdminMessages,
  downloadUsersReport,
  downloadListingsReport,
  downloadMessagesReport,
} from "../services/api";

const Admin = () => {
  const { user } = useAuth();
  const [reportRows, setReportRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportCategory, setReportCategory] = useState("users");
  const [reportFormat, setReportFormat] = useState("pdf");

  const loadReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportCategory === "listings") {
        response = await getAdminListings(user.id, startDate, endDate);
      } else if (reportCategory === "messages") {
        response = await getAdminMessages(user.id, startDate, endDate);
      } else {
        response = await getAdminUsers(user.id, startDate, endDate);
      }

      setReportRows(response);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load report.");
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.is_admin) {
      setLoading(false);
      return;
    }

    loadReport();
  }, [user, reportCategory]);

  const handleDownload = async () => {
    try {
      setError(null);
      let blob;
      let filename;

      if (reportCategory === "listings") {
        blob = await downloadListingsReport(user.id, startDate, endDate, reportFormat);
        filename = `listings-report.${reportFormat}`;
      } else if (reportCategory === "messages") {
        blob = await downloadMessagesReport(user.id, startDate, endDate, reportFormat);
        filename = `messages-report.${reportFormat}`;
      } else {
        blob = await downloadUsersReport(user.id, startDate, endDate, reportFormat);
        filename = `users-report.${reportFormat}`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to download report.");
    }
  };

  const handleApplyFilter = async () => {
    await loadReport();
  };

  if (!user) {
    return <p>Please log in to access admin tools.</p>;
  }

  if (!user.is_admin) {
    return <p>Access denied. Admin permissions are required.</p>;
  }

  const reportTitle = reportCategory === "listings" ? "Listings" : reportCategory === "messages" ? "Messages" : "Users";

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <p>Choose a report category and filter by creation date. Listings and users are filtered by listing creation date, messages are filtered by message date.</p>

      <div className="admin-actions">
        <div className="date-filter-group">
          <label>
            From:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            To:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button type="button" className="button" onClick={handleApplyFilter}>Apply Date Filter</button>
        </div>

        <div className="export-controls">
          <label>
            Report category:
            <select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)}>
              <option value="users">User Reports</option>
              <option value="listings">Listing Reports</option>
              <option value="messages">Message Reports</option>
            </select>
          </label>
          <label>
            Format:
            <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
            </select>
          </label>
          <button type="button" className="button" onClick={handleDownload}>
            Download {reportTitle} Report as {reportFormat.toUpperCase()}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading report...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="admin-users-table">
          <h2>{reportTitle}</h2>
          {reportCategory === "users" && (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Listings</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((userRow) => (
                  <tr key={userRow.id}>
                    <td>{userRow.id}</td>
                    <td>{userRow.name} {userRow.surname}</td>
                    <td>{userRow.email}</td>
                    <td>{userRow.listing_count}</td>
                    <td>{new Date(userRow.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportCategory === "listings" && (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Owner</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((listing) => (
                  <tr key={listing.id}>
                    <td>{listing.id}</td>
                    <td>{listing.title}</td>
                    <td>{listing.price}</td>
                    <td>{listing.location}</td>
                    <td>{listing.user_name} {listing.user_surname}</td>
                    <td>{new Date(listing.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportCategory === "messages" && (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Item</th>
                  <th>Sent</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((messageRow) => (
                  <tr key={messageRow.id}>
                    <td>{messageRow.id}</td>
                    <td>{messageRow.sender_name} {messageRow.sender_surname}</td>
                    <td>{messageRow.receiver_name} {messageRow.receiver_surname}</td>
                    <td>{messageRow.item_title || "N/A"}</td>
                    <td>{new Date(messageRow.created_at).toLocaleString()}</td>
                    <td>{messageRow.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
