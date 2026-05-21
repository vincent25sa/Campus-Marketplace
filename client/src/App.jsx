import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import { useAuth } from "./context/AuthContext";
import "./App.css";

function App() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Header />
      <main className="page-content">
        <Routes>
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
          <Route path="/reset-password" element={user ? <Navigate to="/" /> : <ResetPassword />} />
          <Route path="/create" element={user ? <CreateListing /> : <Navigate to="/login" />} />
          <Route path="/edit-listing/:listing_id" element={user ? <EditListing /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/users/:user_id" element={<UserProfile />} />
          <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.is_admin ? <Admin /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
