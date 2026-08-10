import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import api from "../utils/axios";

function Register() {
  const navigate = useNavigate();
  const { logIn } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // STEP 1:
      // Send signup information and request OTP
      if (!showOTP) {
        await api.post("/signup", {
          name,
          email,
          password,
        });

        setShowOTP(true);

        return;
      }

      // STEP 2:
      // Verify OTP and create account
      const response = await api.post("/verify-otp", {
        email,
        otp,
      });

      console.log("Account created:", response.data);

      // Save user in React authentication state
      logIn(response.data.user);

      // Go to dashboard
      navigate("/dashboard");

    } catch (error: any) {
      console.error("Registration error:", error);

      setError(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-lg border border-gray-100">

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Create an Account
        </h2>

        <p className="text-gray-500">
          Join Eventora today
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center border border-red-100">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {!showOTP ? (
          <>
            {/* NAME */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition shadow-sm"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition shadow-sm"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition shadow-sm"
              />

              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters.
              </p>
            </div>
          </>
        ) : (
          /* OTP */
          <div>
            <div className="bg-green-50 text-green-700 p-3 mb-4 rounded border border-green-200">
              OTP has been sent to your email.
              Please enter it below to complete registration.
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Verification Code
            </label>

            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition shadow-sm font-bold tracking-widest text-center text-lg"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black focus:ring-4 focus:ring-gray-200 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Processing..."
            : showOTP
            ? "Verify & Complete"
            : "Sign Up"}
        </button>
      </form>

      {!showOTP && (
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-gray-900 font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
      )}

    </div>
  );
}

export default Register;