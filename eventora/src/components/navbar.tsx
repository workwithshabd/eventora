import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import { FaTicketAlt, FaUserCircle } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();

  const { user, logOut } = useAuth();

  async function handleLogout() {
    await logOut();
    navigate("/login");
  }

  return (
    <nav className="bg-gray-900 shadow-lg">
      <div className="container mx-auto px-4">

        <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">

          {/* LOGO */}

          <Link
            to="/"
            className="text-white text-2xl font-bold flex items-center gap-2"
          >
            <FaTicketAlt />
            Eventora
          </Link>

          {/* NAVIGATION */}

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">

            {/* HOME */}

            <Link
              to="/"
              className="text-gray-200 hover:text-white transition"
            >
              Events
            </Link>

            {user ? (
              <>
                {/* DASHBOARD */}

                <Link
                  to={
                    user.role === "admin"
                      ? "/admin"
                      : "/dashboard"
                  }
                  className="text-gray-200 hover:text-white transition"
                >
                  {user.role === "admin"
                    ? "Admin Dashboard"
                    : "Dashboard"}
                </Link>

                {/* PROFILE */}

                <Link
                  to="/profile"
                  className="text-gray-200 hover:text-white transition flex items-center gap-2"
                >
                  <FaUserCircle />
                  Profile
                </Link>

                {/* LOGOUT */}

                <button
                  onClick={handleLogout}
                  className="bg-gray-700 hover:bg-black text-white px-4 py-2 rounded-md transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* LOGIN */}

                <Link
                  to="/login"
                  className="text-gray-200 hover:text-white transition"
                >
                  Login
                </Link>

                {/* REGISTER */}

                <Link
                  to="/register"
                  className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-md font-semibold transition"
                >
                  Sign Up
                </Link>
              </>
            )}

          </div>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;