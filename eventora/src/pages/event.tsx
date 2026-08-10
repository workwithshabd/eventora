import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaChair,
  FaMoneyBillWave,
} from "react-icons/fa";

import api from "../utils/axios";
import { useAuth } from "../context/authcontext";

type Event = {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  totalSeats: number;
  availableSeats: number;
  ticketPrice: number;
  image?: string;
};

function EventDetail() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function fetchEvent() {
      if (!id) {
        setError("Event ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/events/${id}`);

        setEvent(response.data.event ?? response.data);
      } catch (error) {
        console.error("Failed to load event:", error);

        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  async function handleBooking() {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!event) {
      return;
    }

    setBookingLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      /*
       * First click:
       * Send OTP to the user's email.
       */
      if (!showOTP) {
        await api.post("/bookings/send-otp");

        setShowOTP(true);

        setSuccessMsg(
          "OTP sent to your email. Please enter it to confirm your booking."
        );

        return;
      }

      /*
       * Second step:
       * Send event ID + OTP to backend.
       */
      await api.post("/bookings", {
        eventId: event._id,
        otp,
      });

      setSuccessMsg(
        "Booking requested! Awaiting admin confirmation."
      );

      setShowOTP(false);
      setOtp("");

      /*
       * Get the latest seat count from the backend.
       */
      const response = await api.get(`/events/${event._id}`);

      setEvent(response.data.event ?? response.data);

    } catch (error: any) {
      console.error("Booking failed:", error);

      setError(
        error.response?.data?.message ||
          "Booking failed. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="text-center py-20 text-xl font-semibold">
        Loading...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-xl text-red-500">
        {error || "Event not found"}
      </div>
    );
  }

  const isSoldOut = event.availableSeats <= 0;

  const bookingCompleted =
    successMsg.includes("Booking requested");

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">

      {/* Event Image */}
      {event.image ? (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-80 object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-gray-900 flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">
          {event.category}
        </div>
      )}

      <div className="p-8 md:p-12">

        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">

          {/* Event Information */}
          <div>

            <div className="inline-block bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
              {event.category}
            </div>

            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              {event.title}
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {event.description}
            </p>

          </div>

          {/* Booking Card */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-w-[300px] w-full md:w-auto shrink-0 shadow-sm">

            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Booking Details
            </h3>

            <div className="space-y-4 mb-8">

              {/* Price */}
              <div className="flex items-center gap-4 text-gray-600">

                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                  <FaMoneyBillWave />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase">
                    Ticket Price
                  </p>

                  <p className="font-bold text-gray-800 text-lg">

                    {event.ticketPrice === 0 ? (
                      <span className="text-green-500">
                        Free
                      </span>
                    ) : (
                      `₹${event.ticketPrice}`
                    )}

                  </p>
                </div>

              </div>

              {/* Availability */}
              <div className="flex items-center gap-4 text-gray-600">

                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                  <FaChair />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase">
                    Availability
                  </p>

                  <p className="font-bold text-gray-800">

                    <span
                      className={
                        event.availableSeats < 10
                          ? "text-orange-500"
                          : ""
                      }
                    >
                      {event.availableSeats}
                    </span>{" "}
                    / {event.totalSeats}

                  </p>
                </div>

              </div>

              {/* Date */}
              <div className="flex items-center gap-4 text-gray-600">

                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                  <FaCalendarAlt />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase">
                    Date
                  </p>

                  <p className="font-bold text-gray-800">
                    {new Date(
                      event.date
                    ).toLocaleDateString()}
                  </p>
                </div>

              </div>

              {/* Location */}
              <div className="flex items-center gap-4 text-gray-600">

                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                  <FaMapMarkerAlt />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase">
                    Location
                  </p>

                  <p className="font-bold text-gray-800">
                    {event.location}
                  </p>
                </div>

              </div>

            </div>

            {/* OTP */}
            {showOTP && (
              <div className="mb-4">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter OTP to Confirm
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                    setOtp(value);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold tracking-widest text-center text-lg"
                />

              </div>
            )}

            {/* Booking Button */}
            <button
              onClick={handleBooking}
              disabled={
                isSoldOut ||
                bookingLoading ||
                bookingCompleted ||
                (showOTP && otp.length !== 6)
              }
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg ${
                isSoldOut ||
                bookingCompleted ||
                (showOTP && otp.length !== 6)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-black text-white hover:shadow-xl hover:-translate-y-1"
              }`}
            >
              {bookingLoading
                ? "Processing..."
                : bookingCompleted
                ? "Request Sent"
                : showOTP
                ? "Verify OTP & Confirm"
                : isSoldOut
                ? "Sold Out"
                : "Confirm Registration"}
            </button>

            {/* Error */}
            {error && (
              <p className="text-red-500 mt-4 text-center font-medium bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            {/* Success */}
            {successMsg && (
              <p className="text-green-600 mt-4 text-center font-medium bg-green-50 p-2 rounded">
                {successMsg}
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;