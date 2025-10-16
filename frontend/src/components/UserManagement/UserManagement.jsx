import { useEffect, useState } from "react";
import "./UserManagement.css"
import api from "../../axios/api";

export default function UserManagement() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/account/get-accounts");

      if (res.data.success) {
        setAccounts(res.data.data);
      } else {
        setError(res.data.message || "Failed to fetch accounts");
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Unable to load accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getFullName = (firstName, middleName, lastName) => {
    const parts = [firstName];
    if (middleName && middleName !== "N/A") {
      parts.push(middleName);
    }
    parts.push(lastName);
    return parts.join(" ");
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      activated: "status-activated",
      deactivated: "status-deactivated",
      pending: "status-pending",
    };
    return statusMap[status] || "status-pending";
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      activated: "Activated",
      deactivated: "Deactivated",
      pending: "Pending",
    };
    return labelMap[status] || status;
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <p className="loading-state">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1 className="user-management-title">USER MANAGEMENT</h1>
        <button className="add-user-btn">+ Add User</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="user-management-table-container">
        <table className="user-management-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    {getFullName(
                      account.firstName,
                      account.middleName,
                      account.lastName
                    )}
                  </td>
                  <td>
                    {account.role.charAt(0).toUpperCase() +
                      account.role.slice(1)}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        account.status
                      )}`}
                    >
                      {getStatusLabel(account.status)}
                    </span>
                  </td>
                  <td>{formatDate(account.createdAt)}</td>
                  <td>
                    <button className="view-btn">View</button>
                    <button className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No accounts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}