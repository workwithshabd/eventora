import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { useAuth } from "../context/authcontext";

type ProfileUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt?: string;
};

function Profile() {
  const navigate = useNavigate();
  const { logIn } = useAuth();

  const [profile, setProfile] = useState<ProfileUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  // ==========================================
  // FETCH PROFILE
  // ==========================================

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get("/me");

        const profileUser = response.data.user;

        setProfile(profileUser);

        // Keep AuthContext synchronized
        logIn(profileUser);
      } catch (error: any) {
        console.error("Failed to load profile:", error);

        if (error.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate, logIn]);

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  async function handleChangePassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Basic frontend validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (oldPassword === newPassword) {
      setError(
        "New password must be different from your old password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.post(
        "/change-password",
        {
          oldPassword,
          newPassword,
        }
      );

      setSuccess(
        response.data?.message ||
          "Password changed successfully."
      );

      // Clear password fields after success
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(
        "Change password error:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          error.response?.data?.message ||
            "Your current password is incorrect."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to change password."
        );
      }
    } finally {
      setChangingPassword(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl font-semibold text-gray-600">
          Loading profile...
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !profile) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-red-500 text-lg font-semibold mb-4">
          {error}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Profile not found.
      </div>
    );
  }

  // ==========================================
  // PROFILE PAGE
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ======================================
          PROFILE CARD
      ====================================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Profile Header */}

        <div className="bg-gray-900 px-8 py-10 text-white">

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar */}

            <div className="w-24 h-24 rounded-full bg-white text-gray-900 flex items-center justify-center text-4xl font-black uppercase shrink-0">
              {profile.name.charAt(0)}
            </div>

            <div className="text-center sm:text-left">

              <h1 className="text-3xl font-extrabold mb-2">
                {profile.name}
              </h1>

              <p className="text-gray-300">
                {profile.email}
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">

                <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-bold uppercase">
                  {profile.role}
                </span>

                {profile.isVerified && (
                  <span className="px-3 py-1 rounded-full bg-green-500 text-white text-sm font-bold">
                    Verified
                  </span>
                )}

              </div>

            </div>
          </div>
        </div>

        {/* Profile Information */}

        <div className="p-8">

          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Profile Information
          </h2>

          <div className="space-y-5">

            {/* Name */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-2">
              <span className="text-sm font-semibold text-gray-400 uppercase">
                Full Name
              </span>

              <span className="font-semibold text-gray-800">
                {profile.name}
              </span>
            </div>

            {/* Email */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-2">
              <span className="text-sm font-semibold text-gray-400 uppercase">
                Email
              </span>

              <span className="font-semibold text-gray-800 break-all">
                {profile.email}
              </span>
            </div>

            {/* Role */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-2">
              <span className="text-sm font-semibold text-gray-400 uppercase">
                Account Type
              </span>

              <span className="font-semibold text-gray-800 capitalize">
                {profile.role}
              </span>
            </div>

            {/* Verification */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-2">
              <span className="text-sm font-semibold text-gray-400 uppercase">
                Email Verification
              </span>

              <span
                className={`font-bold ${
                  profile.isVerified
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {profile.isVerified
                  ? "Verified"
                  : "Not Verified"}
              </span>
            </div>

            {/* User ID */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-2">
              <span className="text-sm font-semibold text-gray-400 uppercase">
                User ID
              </span>

              <span className="font-mono text-sm text-gray-600 break-all">
                {profile._id}
              </span>
            </div>

            {/* Member Since */}

            {profile.createdAt && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-semibold text-gray-400 uppercase">
                  Member Since
                </span>

                <span className="font-semibold text-gray-800">
                  {new Date(
                    profile.createdAt
                  ).toLocaleDateString()}
                </span>
              </div>
            )}

          </div>

          {/* Dashboard */}

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-8 bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-black transition"
          >
            My Dashboard
          </button>

        </div>
      </div>

      {/* ======================================
          CHANGE PASSWORD
      ====================================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Change Password
          </h2>

          <p className="text-gray-500 mt-1">
            Update your account password.
          </p>

        </div>

        {/* Success */}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6">
            {success}
          </div>
        )}

        {/* Error */}

        {error && profile && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <form
          onSubmit={handleChangePassword}
          className="space-y-5"
        >

          {/* Current Password */}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Password
            </label>

            <input
              type="password"
              value={oldPassword}
              onChange={(e) =>
                setOldPassword(e.target.value)
              }
              placeholder="Enter your current password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition"
            />
          </div>

          {/* New Password */}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              placeholder="Enter your new password"
              autoComplete="new-password"
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition"
            />

            <p className="text-xs text-gray-500 mt-2">
              Password must be at least 8 characters.
            </p>
          </div>

          {/* Confirm Password */}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm your new password"
              autoComplete="new-password"
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition"
            />
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {changingPassword
              ? "Changing Password..."
              : "Change Password"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default Profile;