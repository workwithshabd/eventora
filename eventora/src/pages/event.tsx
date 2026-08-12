import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaChair,
  FaMoneyBillWave,
  FaTimesCircle,
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

type Booking = {
  _id: string;
  event:
    | string
    | {
        _id: string;
      };
  quantity: number;
  ticketPrice: number;
  totalPrice: number;
  status: "confirmed" | "cancelled";
};

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);

  const [booking, setBooking] = useState<Booking | null>(null);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ======================================================
  // FETCH EVENT
  // ======================================================

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

  // ======================================================
  // FETCH USER'S BOOKINGS
  // ======================================================

  useEffect(() => {
    async function fetchMyBooking() {
      if (!user || !id) {
        setBooking(null);
        return;
      }

      try {
        const response = await api.get("/bookings/my");

        const bookings: Booking[] =
          response.data.bookings ?? [];

        const existingBooking = bookings.find(
          (item) => {
            const eventId =
              typeof item.event === "string"
                ? item.event
                : item.event._id;

            return (
              eventId === id &&
              item.status === "confirmed"
            );
          },
        );

        setBooking(existingBooking ?? null);
      } catch (error) {
        console.error(
          "Failed to load user bookings:",
          error,
        );

        // Do not block the event page if booking
        // history fails to load.
        setBooking(null);
      }
    }

    if (!authLoading) {
      fetchMyBooking();
    }
  }, [user, id, authLoading]);

  // ======================================================
  // BOOK EVENT
  // ======================================================

  async function handleBooking() {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!event) {
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "You must book at least one ticket.",
      );
      return;
    }

    if (
      quantity > event.availableSeats
    ) {
      setError(
        `Only ${event.availableSeats} ticket(s) are available.`,
      );
      return;
    }

    setBookingLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await api.post(
        `/bookings/${event._id}`,
        {
          quantity,
        },
      );

      const newBooking =
        response.data.booking;

      setBooking(newBooking);

      setSuccessMsg(
        "Event booked successfully! A confirmation email has been sent to your email address.",
      );

      setQuantity(1);

      // Refresh event so available seats update.
      const eventResponse =
        await api.get(
          `/events/${event._id}`,
        );

      setEvent(
        eventResponse.data.event ??
          eventResponse.data,
      );

    } catch (error: any) {
      console.error(
        "Booking failed:",
        error,
      );

      setError(
        error.response?.data?.message ||
          "Booking failed. Please try again.",
      );
    } finally {
      setBookingLoading(false);
    }
  }

  // ======================================================
  // CANCEL BOOKING
  // ======================================================

  async function handleCancelBooking() {
    if (!booking) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this booking?",
      );

    if (!confirmed) {
      return;
    }

    setCancelLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await api.patch(
        `/bookings/${booking._id}/cancel`,
      );

      setBooking(null);

      setSuccessMsg(
        "Booking cancelled successfully. Your tickets have been returned to the event.",
      );

      // Refresh event so available seats update.
      if (event) {
        const response =
          await api.get(
            `/events/${event._id}`,
          );

        setEvent(
          response.data.event ??
            response.data,
        );
      }

    } catch (error: any) {
      console.error(
        "Cancel booking failed:",
        error,
      );

      setError(
        error.response?.data?.message ||
          "Failed to cancel booking. Please try again.",
      );
    } finally {
      setCancelLoading(false);
    }
  }

  // ======================================================
  // LOADING
  // ======================================================

  if (authLoading || loading) {
    return (
      <div className="text-center py-20 text-xl font-semibold">
        Loading...
      </div>
    );
  }

  // ======================================================
  // EVENT NOT FOUND
  // ======================================================

  if (!event) {
    return (
      <div className="text-center py-20 text-xl text-red-500">
        {error || "Event not found"}
      </div>
    );
  }

  const isSoldOut =
    event.availableSeats <= 0;

  const totalPrice =
    event.ticketPrice * quantity;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">

      {/* ==================================================
          EVENT IMAGE
      ================================================== */}

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

          {/* ==================================================
              EVENT INFORMATION
          ================================================== */}

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

          {/* ==================================================
              BOOKING CARD
          ================================================== */}

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-w-[300px] w-full md:w-auto shrink-0 shadow-sm">

            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Booking Details
            </h3>

            <div className="space-y-4 mb-8">

              {/* PRICE */}

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

              {/* AVAILABILITY */}

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

              {/* DATE */}

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
                      event.date,
                    ).toLocaleDateString()}
                  </p>
                </div>

              </div>

              {/* LOCATION */}

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

            {/* ==================================================
                EXISTING BOOKING
            ================================================== */}

            {booking && (
              <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-xl">

                <div className="flex items-center gap-3 mb-3">

                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    ✓
                  </div>

                  <div>
                    <p className="font-bold text-green-800">
                      You are registered
                    </p>

                    <p className="text-sm text-green-700">
                      Your booking is confirmed.
                    </p>
                  </div>

                </div>

                <div className="text-sm text-green-800 space-y-1">

                  <p>
                    Tickets:{" "}
                    <strong>
                      {booking.quantity}
                    </strong>
                  </p>

                  <p>
                    Total:{" "}
                    <strong>
                      ₹{booking.totalPrice}
                    </strong>
                  </p>

                </div>

                <button
                  onClick={handleCancelBooking}
                  disabled={cancelLoading}
                  className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTimesCircle />

                  {cancelLoading
                    ? "Cancelling..."
                    : "Cancel Booking"}
                </button>

              </div>
            )}

            {/* ==================================================
                NEW BOOKING
            ================================================== */}

            {!booking && !isSoldOut && (
              <>
                {/* QUANTITY */}

                <div className="mb-4">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Tickets
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={event.availableSeats}
                    value={quantity}
                    disabled={bookingLoading}
                    onChange={(e) => {
                      const value =
                        Number(
                          e.target.value,
                        );

                      if (
                        Number.isInteger(
                          value,
                        ) &&
                        value >= 1 &&
                        value <=
                          event.availableSeats
                      ) {
                        setQuantity(value);
                        setError("");
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold text-center"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Maximum{" "}
                    {event.availableSeats}{" "}
                    tickets available.
                  </p>

                </div>

                {/* TOTAL */}

                <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">

                  <div className="flex justify-between items-center">

                    <span className="font-semibold text-gray-600">
                      Total
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      ₹{totalPrice}
                    </span>

                  </div>

                </div>

                {/* BOOK BUTTON */}

                <button
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg bg-gray-900 hover:bg-black text-white hover:shadow-xl hover:-translate-y-1 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {bookingLoading
                    ? "Booking..."
                    : "Book Event"}
                </button>
              </>
            )}

            {/* ==================================================
                SOLD OUT
            ================================================== */}

            {!booking && isSoldOut && (
              <button
                disabled
                className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                Sold Out
              </button>
            )}

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <p className="text-red-500 mt-4 text-center font-medium bg-red-50 p-3 rounded">
                {error}
              </p>
            )}

            {/* ==================================================
                SUCCESS
            ================================================== */}

            {successMsg && (
              <p className="text-green-600 mt-4 text-center font-medium bg-green-50 p-3 rounded">
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