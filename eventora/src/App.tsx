import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar";

import Home from "./pages/home";
import EventDetail from "./pages/event";
import Login from "./pages/login";
import Register from "./pages/register";
import UserDashboard from "./pages/userdashboard";
import Profile from "./pages/profile";
import AdminDashboard from "./pages/admindashboard";
import PaymentSuccess from "./pages/paymentsuccess";
import PaymentFailed from "./pages/paymentfailed";

import { AuthProvider } from "./context/authcontext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">

          <Navbar />

          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <Routes>

              {/* Home */}
              <Route
                path="/"
                element={<Home />}
              />

              {/* Event */}
              <Route
                path="/events/:id"
                element={<EventDetail />}
              />

              {/* Authentication */}
              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />

              {/* User */}
              <Route
                path="/dashboard"
                element={<UserDashboard />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

              {/* Admin */}
              <Route
                path="/admin"
                element={<AdminDashboard />}
              />

              {/* Payment */}
              <Route
                path="/payment-success"
                element={<PaymentSuccess />}
              />

              <Route
                path="/payment-failed"
                element={<PaymentFailed />}
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="text-center mt-20">
                    <h1 className="text-3xl font-bold text-gray-900">
                      404 - Page Not Found
                    </h1>
                  </div>
                }
              />

            </Routes>

          </main>

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;