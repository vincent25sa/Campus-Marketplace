import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header>
      <div className="header-nav">
        <Link className="header-brand" to="/">
          Campus Marketplace
        </Link>
        <nav className="nav-links">
          <Link className="nav-link" to="/">Search</Link>
          {user ? (
            <>
                  <Link className="nav-link" to="/create">Create Listing</Link>
                  <Link className="nav-link" to="/messages">Messages</Link>
                  {user.is_admin && <Link className="nav-link" to="/admin">Admin</Link>}
                  <Link className="nav-link" to="/profile">
                    {user.profile_image ? (
                      <img src={user.profile_image} alt="profile" style={{ width: 28, height: 28, borderRadius: 9999, marginRight: 8, objectFit: "cover" }} />
                    ) : null}
                    Profile
                  </Link>
              <button className="nav-link" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">Login</Link>
              <Link className="nav-link" to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
