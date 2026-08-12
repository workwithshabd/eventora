import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../utils/axios";
import { useAuth } from "../context/authcontext.tsx";

// ======================================================
// TYPES
// ======================================================

type Event = {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
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
  date: string;
  location: string;
  price: number;
  totalSeats?: number;
  availableSeats?: number;
};

type Booking = {
  _id: string;
  user: BookingUser;
  event: BookingEvent;
  quantity: number;
  ticketPrice: number;
  totalPrice: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
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

// ======================================================
// ADMIN DASHBOARD
// ======================================================

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);

  const [showEventForm, setShowEventForm] =
    useState(false);

  const [formData, setFormData] =
    useState<EventFormData>(initialFormData);

  // ======================================================
  // CHECK ADMIN + FETCH DATA
  // ======================================================

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

  // ======================================================
  // FETCH EVENTS + BOOKINGS
  // ======================================================

  async function fetchData() {
    try {
      setLoading(true);

      const [eventsResponse, bookingsResponse] =
        await Promise.all([
          api.get("/events"),
          api.get("/bookings"),
        ]);

      console.log(
        "Admin events:",
        eventsResponse.data
      );

      console.log(
        "Admin bookings:",
        bookingsResponse.data
      );

      setEvents(
        eventsResponse.data.events || []
      );

      setBookings(
        bookingsResponse.data.bookings || []
      );
    } catch (error: any) {
      console.error(
        "Error fetching admin data:",
        error.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // FORM CHANGE
  // ======================================================

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

  // ======================================================
  // CREATE EVENT
  // ======================================================

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
        price: Number(formData.ticketPrice),
        image: formData.image,
      });

      setShowEventForm(false);

      setFormData(initialFormData);

      await fetchData();
    } catch (error: any) {
      console.error(
        "Create event error:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Error creating event"
      );
    }
  }

  // ======================================================
  // DELETE EVENT
  // ======================================================

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
      console.error(
        "Delete event error:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Error deleting event"
      );
    }
  }

  // ======================================================
  // CANCEL BOOKING
  // ======================================================

  async function handleCancelBooking(
    id: string
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/bookings/admin/${id}/cancel`
      );

      await fetchData();
    } catch (error: any) {
      console.error(
        "Cancel booking error:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Error cancelling booking"
      );
    }
  }

  // ======================================================
  // LOADING
  // ======================================================

  if (authLoading || loading) {
    return (
      <div className="text-center py-20 text-xl font-semibold">
        Loading admin panel...
      </div>
    );
  }

  // ======================================================
  // SECURITY CHECK
  // ======================================================

  if (!user || user.role !== "admin") {
    return null;
  }

  // ======================================================
  // STATISTICS
  // ======================================================

  const totalRevenue = bookings.reduce(
    (sum, booking) => {
      if (booking.status === "confirmed") {
        return sum + booking.totalPrice;
      }

      return sum;
    },
    0
  );

  const confirmedClients = new Set(
    bookings
      .filter(
        (booking) =>
          booking.status === "confirmed"
      )
      .map(
        (booking) =>
          booking.user?._id
      )
      .filter(Boolean)
  ).size;

  const confirmedBookings = bookings.filter(
    (booking) =>
      booking.status === "confirmed"
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) =>
      booking.status === "cancelled"
  ).length;

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="bg-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Admin Dashboard
          </h1>

          <p className="text-gray-300">
            Manage events and bookings.
          </p>
        </div>

        <button
          onClick={() =>
            setShowEventForm(
              (previous) => !previous
            )
          }
          className="w-full md:w-auto bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition shadow-md"
        >
          {showEventForm
            ? "Cancel Creation"
            : "+ Create New Event"}
        </button>

      </div>

      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* REVENUE */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">
            Total Revenue
          </p>

          <h3 className="text-3xl font-black text-green-600">
            ₹{totalRevenue}
          </h3>

        </div>

        {/* CLIENTS */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">
            Confirmed Clients
          </p>

          <h3 className="text-3xl font-black text-blue-600">
            {confirmedClients}
          </h3>

        </div>

        {/* BOOKINGS */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">
            Confirmed Bookings
          </p>

          <h3 className="text-3xl font-black text-green-600">
            {confirmedBookings}
          </h3>

        </div>

        {/* CANCELLED */}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">
            Cancelled
          </p>

          <h3 className="text-3xl font-black text-red-600">
            {cancelledBookings}
          </h3>

        </div>

      </div>

      {/* ==================================================
          CREATE EVENT FORM
      ================================================== */}

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

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ==================================================
            EVENTS
        ================================================== */}

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

                        <span>
                          ₹{event.price}
                        </span>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        handleDeleteEvent(
                          event._id
                        )
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

        {/* ==================================================
            BOOKINGS
        ================================================== */}

        <div>

          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">

            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              {bookings.length}
            </span>

            Bookings

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
                      booking.status ===
                      "confirmed"
                        ? "border-l-green-400"
                        : "border-l-red-400"
                    }`}
                  >

                    {/* BOOKING HEADER */}

                    <div className="flex justify-between items-start mb-4 gap-4">

                      <h4 className="font-bold text-gray-900 text-lg">
                        {booking.event?.title ||
                          "Deleted Event"}
                      </h4>

                      <span
                        className={`px-2 py-1 text-[10px] font-black rounded uppercase ${
                          booking.status ===
                          "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {booking.status}
                      </span>

                    </div>

                    {/* BOOKING DETAILS */}

                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100 text-sm">

                      <p className="text-gray-700 mb-2">
                        <strong>
                          User:
                        </strong>{" "}
                        {booking.user?.name ||
                          "Unknown"}
                      </p>

                      <p className="text-gray-700 mb-2">
                        <strong>
                          Email:
                        </strong>{" "}
                        {booking.user?.email ||
                          "Unknown"}
                      </p>

                      <p className="text-gray-700 mb-2">
                        <strong>
                          Tickets:
                        </strong>{" "}
                        {booking.quantity}
                      </p>

                      <p className="text-gray-700 mb-2">
                        <strong>
                          Ticket Price:
                        </strong>{" "}
                        ₹{booking.ticketPrice}
                      </p>

                      <p className="text-gray-700 mb-2">
                        <strong>
                          Total:
                        </strong>{" "}
                        {booking.totalPrice === 0
                          ? "Free"
                          : `₹${booking.totalPrice}`}
                      </p>

                      <p className="text-gray-700">
                        <strong>
                          Booked:
                        </strong>{" "}
                        {new Date(
                          booking.createdAt
                        ).toLocaleString()}
                      </p>

                      {booking.event && (
                        <p className="text-gray-700 mt-3 pt-3 border-t border-gray-200">
                          <strong>
                            Event:
                          </strong>{" "}
                          {booking.event.title}
                        </p>
                      )}

                    </div>

                    {/* CANCEL BUTTON */}

                    {booking.status ===
                      "confirmed" && (

                      <button
                        onClick={() =>
                          handleCancelBooking(
                            booking._id
                          )
                        }
                        className="w-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-sm font-bold py-3 px-4 rounded-lg transition"
                      >
                        Cancel Booking
                      </button>

                    )}

                    {booking.status ===
                      "cancelled" && (

                      <div className="text-center text-red-500 bg-red-50 border border-red-100 rounded-lg py-3 font-semibold">
                        Booking Cancelled
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