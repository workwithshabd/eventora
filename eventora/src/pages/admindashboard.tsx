import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../utils/axios";
import { useAuth } from "../context/authcontext.tsx";

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

type BookingUser = {
  _id: string;
  name: string;
  email: string;
};

type BookingEvent = {
  _id: string;
  title: string;
  totalSeats: number;
  availableSeats: number;
};

type Booking = {
  _id: string;
  userId?: BookingUser;
  eventId?: BookingEvent;
  amount: number;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "paid" | "not_paid";
  bookedAt: string;
};

type EventFormData = {
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  totalSeats: string;
  ticketPrice: string;
  image: string;
};

const initialFormData: EventFormData = {
  title: "",
  description: "",
  date: "",
  location: "",
  category: "",
  totalSeats: "",
  ticketPrice: "",
  image: "",
};

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);

  const [showEventForm, setShowEventForm] = useState(false);

  const [formData, setFormData] =
    useState<EventFormData>(initialFormData);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchData();
  }, [user, authLoading, navigate]);

  async function fetchData() {
    try {
      setLoading(true);

      const [eventsResponse, bookingsResponse] =
        await Promise.all([
          api.get("/events"),
          api.get("/bookings"),
        ]);

      setEvents(eventsResponse.data.events);
      setBookings(bookingsResponse.data.bookings);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCreateEvent(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      await api.post("/events", {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        category: formData.category,
        totalSeats: Number(formData.totalSeats),
        ticketPrice: Number(formData.ticketPrice),
        image: formData.image,
      });

      setShowEventForm(false);
      setFormData(initialFormData);

      await fetchData();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Error creating event"
      );
    }
  }

  async function handleDeleteEvent(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);

      await fetchData();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Error deleting event"
      );
    }
  }

  async function handleConfirmBooking(
    id: string,
    paymentStatus: "paid" | "not_paid"
  ) {
    try {
      await api.put(`/bookings/${id}/confirm`, {
        paymentStatus,
      });

      await fetchData();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Error confirming booking"
      );
    }
  }

  async function handleCancelBooking(id: string) {
    const confirmed = window.confirm(
      "Cancel this user's booking request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/bookings/${id}`);

      await fetchData();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Error cancelling booking"
      );
    }
  }

  if (authLoading || loading) {
    return (
      <div className="text-center py-20 text-xl font-semibold">
        Loading admin panel...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const totalRevenue = bookings.reduce(
    (sum, booking) => {
      if (
        booking.paymentStatus === "paid" &&
        booking.status === "confirmed"
      ) {
        return sum + booking.amount;
      }

      return sum;
    },
    0
  );

  const paidClients = new Set(
    bookings
      .filter(
        (booking) =>
          booking.paymentStatus === "paid" &&
          booking.status === "confirmed"
      )
      .map((booking) => booking.userId?._id)
      .filter(Boolean)
  ).size;

  const pendingRequests = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="bg-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Admin Dashboard
          </h1>

          <p className="text-gray-300">
            Manage events and manually confirm bookings.
          </p>
        </div>

        <button
          onClick={() =>
            setShowEventForm((previous) => !previous)
          }
          className="w-full md:w-auto bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition shadow-md"
        >
          {showEventForm
            ? "Cancel Creation"
            : "+ Create New Event"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

          <div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
              Total Revenue
            </p>

            <h3 className="text-3xl font-black text-green-600">
              ₹{totalRevenue}
            </h3>
          </div>

          <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-xl font-bold">
            ₹
          </div>

        </div>

        {/* Paid clients */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

          <div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
              Paid Clients
            </p>

            <h3 className="text-3xl font-black text-blue-600">
              {paidClients}
            </h3>
          </div>

          <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
            👤
          </div>

        </div>

        {/* Pending */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

          <div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
              Pending Requests
            </p>

            <h3 className="text-3xl font-black text-yellow-600">
              {pendingRequests}
            </h3>
          </div>

          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xl font-bold">
            ⏳
          </div>

        </div>

      </div>

      {/* Create Event Form */}
      {showEventForm && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">

          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Create New Event
          </h2>

          <form
            onSubmit={handleCreateEvent}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >

            <input
              required
              name="title"
              type="text"
              placeholder="Event Title"
              value={formData.title}
              onChange={handleFormChange}
              className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <input
              required
              name="category"
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={handleFormChange}
              className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <input
              required
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
              className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <input
              required
              name="location"
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={handleFormChange}
              className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <input
              required
              name="totalSeats"
              type="number"
              min="1"
              placeholder="Total Seats"
              value={formData.totalSeats}
              onChange={handleFormChange}
              className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <input
              required
              name="ticketPrice"
              type="number"
              min="0"
              placeholder="Ticket Price"
              value={formData.ticketPrice}
              onChange={handleFormChange}
              className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <input
              name="image"
              type="text"
              placeholder="Image URL"
              value={formData.image}
              onChange={handleFormChange}
              className="w-full border px-4 py-3 rounded-lg md:col-span-2 focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <textarea
              required
              name="description"
              placeholder="Event Description"
              value={formData.description}
              onChange={handleFormChange}
              className="border px-4 py-3 rounded-lg md:col-span-2 h-32 focus:ring-2 focus:ring-gray-700 outline-none"
            />

            <button
              type="submit"
              className="md:col-span-2 bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition"
            >
              Publish Event
            </button>

          </form>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Events */}
        <div>

          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">

            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">
              {events.length}
            </span>

            All Events
          </h2>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">

              {events.length === 0 ? (

                <li className="p-6 text-gray-500 text-center">
                  No events created yet.
                </li>

              ) : (

                events.map((event) => (

                  <li
                    key={event._id}
                    className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition"
                  >

                    <div>

                      <h4 className="font-bold text-gray-900 mb-1">
                        {event.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">

                        <span>
                          {new Date(
                            event.date
                          ).toLocaleDateString()}
                        </span>

                        <span>
                          {event.availableSeats}/
                          {event.totalSeats} seats
                        </span>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        handleDeleteEvent(event._id)
                      }
                      className="w-full sm:w-auto text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold transition"
                    >
                      Delete
                    </button>

                  </li>

                ))
              )}

            </ul>

          </div>
        </div>

        {/* Bookings */}
        <div>

          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">

            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">
              {bookings.length}
            </span>

            Booking Requests
          </h2>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">

              {bookings.length === 0 ? (

                <li className="p-6 text-gray-500 text-center">
                  No bookings yet.
                </li>

              ) : (

                bookings.map((booking) => (

                  <li
                    key={booking._id}
                    className={`p-6 border-l-4 ${
                      booking.status === "pending"
                        ? "border-l-yellow-400"
                        : booking.status === "confirmed"
                        ? "border-l-green-400"
                        : "border-l-red-400"
                    }`}
                  >

                    <div className="flex justify-between items-start mb-3">

                      <h4 className="font-bold text-gray-900 text-lg">
                        {booking.eventId?.title ||
                          "Deleted Event"}
                      </h4>

                      <div className="flex flex-col gap-1 items-end">

                        <span className="px-2 py-1 text-[10px] font-black rounded uppercase bg-gray-100">
                          {booking.status}
                        </span>

                        <span className="px-2 py-1 text-[10px] font-black rounded uppercase bg-gray-100">
                          {booking.paymentStatus.replace(
                            "_",
                            " "
                          )}
                        </span>

                      </div>

                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100 text-sm">

                      <p className="text-gray-700 mb-1">
                        <strong>User:</strong>{" "}
                        {booking.userId?.name || "Unknown"}
                      </p>

                      <p className="text-gray-700 mb-1">
                        <strong>Email:</strong>{" "}
                        {booking.userId?.email || "Unknown"}
                      </p>

                      <p className="text-gray-700 mb-1">
                        <strong>Amount:</strong>{" "}
                        {booking.amount === 0
                          ? "Free"
                          : `₹${booking.amount}`}
                      </p>

                      <p className="text-gray-700 mb-1">
                        <strong>Date:</strong>{" "}
                        {new Date(
                          booking.bookedAt
                        ).toLocaleString()}
                      </p>

                      {booking.eventId && (
                        <p className="text-gray-700 mt-2 pt-2 border-t border-gray-200">
                          <strong>Seats:</strong>{" "}
                          {booking.eventId.availableSeats}{" "}
                          remaining of{" "}
                          {booking.eventId.totalSeats}
                        </p>
                      )}

                    </div>

                    {booking.status === "pending" && (

                      <div className="flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            handleConfirmBooking(
                              booking._id,
                              "paid"
                            )
                          }
                          className="flex-1 min-w-[120px] bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 text-xs font-bold py-2.5 px-3 rounded-lg"
                        >
                          ✓ Approve as Paid
                        </button>

                        <button
                          onClick={() =>
                            handleConfirmBooking(
                              booking._id,
                              "not_paid"
                            )
                          }
                          className="flex-1 min-w-[120px] bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white border border-gray-200 text-xs font-bold py-2.5 px-3 rounded-lg"
                        >
                          ✓ Approve Undecided
                        </button>

                        <button
                          onClick={() =>
                            handleCancelBooking(
                              booking._id
                            )
                          }
                          className="w-[80px] bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-xs font-bold py-2.5 px-3 rounded-lg"
                        >
                          ✕ Reject
                        </button>

                      </div>
                    )}

                  </li>

                ))
              )}

            </ul>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;