import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTicketAlt, FaTimesCircle } from "react-icons/fa";
import { useAuth } from "../context/authcontext";
import api from "../utils/axios";

type Event = {
  _id: string;
  title: string;
  date: string;
  location: string;
  price: number;
};

type Booking = {
  _id: string;
  event: Event | null;
  quantity: number;
  ticketPrice: number;
  totalPrice: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    fetchBookings();
  }, [user, authLoading, navigate]);

  async function fetchBookings() {
    try {
      setLoading(true);

      const response = await api.get("/bookings/my");

      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(`/bookings/${id}/cancel`);

      await fetchBookings();
    } catch (error: any) {
      console.error("Error cancelling booking:", error);

      alert(
        error.response?.data?.message ||
          "Error cancelling booking"
      );
    }
  }

  if (authLoading || loading) {
    return (
      <div className="text-center py-20 text-xl font-semibold">
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* USER HEADER */}
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">

        <div className="w-20 h-20 bg-gray-200 text-gray-900 rounded-full flex items-center justify-center text-3xl font-bold uppercase shrink-0">
          {user.name.charAt(0)}
        </div>

        <div className="flex flex-col items-center sm:items-start">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Welcome, {user.name}!
          </h1>

          <p className="text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            User Dashboard
          </p>

          <p className="text-sm text-gray-400 mt-1">
            {user.email}
          </p>
        </div>

      </div>

      {/* BOOKINGS HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
          <FaTicketAlt className="text-gray-700" />
          My Bookings
        </h2>
      </div>

      {/* NO BOOKINGS */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">

          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTicketAlt className="text-gray-300 text-3xl" />
          </div>

          <p className="text-xl text-gray-500 mb-6 mt-4 font-medium">
            You haven't booked any events yet.
          </p>

          <Link
            to="/"
            className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition shadow-md"
          >
            Browse Events
          </Link>

        </div>
      ) : (

        /* BOOKINGS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {bookings.map((booking) => (

            <div
              key={booking._id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col"
            >

              {/* BOOKING CONTENT */}
              <div className="p-6 flex-grow">

                {booking.event ? (
                  <>

                    {/* TITLE + STATUS */}
                    <div className="flex justify-between items-start mb-4 gap-3">

                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {booking.event.title}
                      </h3>

                      <span
                        className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider shrink-0 ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {booking.status}
                      </span>

                    </div>

                    {/* EVENT DETAILS */}
                    <div className="text-sm text-gray-500 mb-4 space-y-2">

                      <p>
                        <strong className="text-gray-700">
                          Date:
                        </strong>{" "}
                        {new Date(
                          booking.event.date
                        ).toLocaleDateString()}
                      </p>

                      <p>
                        <strong className="text-gray-700">
                          Location:
                        </strong>{" "}
                        {booking.event.location}
                      </p>

                      <p>
                        <strong className="text-gray-700">
                          Tickets:
                        </strong>{" "}
                        {booking.quantity}
                      </p>

                      <p>
                        <strong className="text-gray-700">
                          Price per ticket:
                        </strong>{" "}
                        {booking.ticketPrice === 0
                          ? "Free"
                          : `₹${booking.ticketPrice}`}
                      </p>

                      <p>
                        <strong className="text-gray-700">
                          Total:
                        </strong>{" "}
                        {booking.totalPrice === 0
                          ? "Free"
                          : `₹${booking.totalPrice}`}
                      </p>

                      <p>
                        <strong className="text-gray-700">
                          Booked:
                        </strong>{" "}
                        {new Date(
                          booking.createdAt
                        ).toLocaleDateString()}
                      </p>

                    </div>

                  </>
                ) : (

                  <p className="text-red-500 italic">
                    Event details unavailable.
                  </p>

                )}

              </div>

              {/* ACTIONS */}
              <div className="p-4 bg-gray-50 flex justify-between items-center shrink-0">

                {booking.event && booking.status !== "cancelled" ? (
                  <>

                    <Link
                      to={`/events/${booking.event._id}`}
                      className="text-gray-900 font-semibold text-sm hover:underline"
                    >
                      View Event
                    </Link>

                    <button
                      onClick={() =>
                        cancelBooking(booking._id)
                      }
                      className="text-red-500 font-semibold text-sm hover:text-red-700 transition flex items-center gap-1"
                    >
                      <FaTimesCircle />
                      Cancel
                    </button>

                  </>
                ) : (

                  <div className="w-full text-center text-sm text-red-500 italic">
                    Booking Cancelled
                  </div>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default UserDashboard;