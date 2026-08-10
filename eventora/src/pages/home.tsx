import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../utils/axios";

import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaRegClock,
  FaTicketAlt,
  FaShieldAlt,
} from "react-icons/fa";

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

function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [search]);

  async function fetchEvents() {
    try {
      setLoading(true);

      const response = await api.get(
        `/events?search=${encodeURIComponent(search)}`
      );

      console.log("Events API response:", response.data);

      /*
       * Your backend should return something like:
       *
       * {
       *   success: true,
       *   events: [...]
       * }
       *
       * So we use response.data.events.
       */
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);

      // Make sure events remains an array.
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* HERO SECTION */}

      <div className="relative bg-black text-white rounded-3xl overflow-hidden mb-12 shadow-2xl">

        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

        <div className="relative p-10 md:p-20 text-center flex flex-col items-center z-10">

          <span className="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">
            Welcome to Eventora
          </span>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg">
            Find Your Next
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
              Unforgettable
            </span>{" "}
            Experience
          </h1>

          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Discover the best tech conferences, late-night music festivals,
            and hands-on workshops happening directly in your area. Secure
            your spot today.
          </p>

          {/* SEARCH */}

          <div className="w-full max-w-2xl mx-auto relative flex items-center shadow-2xl group">

            <FaSearch className="absolute left-6 text-gray-500 text-xl group-focus-within:text-black transition-colors" />

            <input
              type="text"
              placeholder="Search events by title..."
              className="w-full pl-16 pr-6 py-5 rounded-full text-lg text-black bg-white/95 backdrop-blur-sm border-2 border-transparent focus:border-gray-500 focus:outline-none transition-all placeholder-gray-400 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </div>
      </div>

      {/* FEATURES */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-4">

        {/* Fast Booking */}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">

          <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md">
            <FaRegClock />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Fast Booking
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed">
            Secure your tickets instantly with our fast streamlined booking
            infrastructure built for speed.
          </p>

        </div>

        {/* Seamless Access */}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">

          <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md">
            <FaTicketAlt />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Seamless Access
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed">
            Manage your bookings and tickets directly from your personal
            dashboard.
          </p>

        </div>

        {/* Secure Platform */}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">

          <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md">
            <FaShieldAlt />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Secure Platform
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed">
            Your account and bookings are protected by secure authentication
            and OTP verification.
          </p>

        </div>

      </div>

      {/* EVENTS HEADER */}

      <div className="flex items-center justify-between mb-8 px-2 border-b border-gray-200 pb-4">

        <h2 className="text-3xl font-extrabold text-gray-900">
          Upcoming Events
        </h2>

        <div className="text-gray-500 font-medium">
          {events.length} results found
        </div>

      </div>

      {/* LOADING */}

      {loading ? (

        <div className="text-center py-20 text-xl font-semibold text-gray-600">
          Loading events...
        </div>

      ) : events.length === 0 ? (

        /* NO EVENTS */

        <div className="text-center py-20 text-xl text-gray-500">
          No events found matching your search.
        </div>

      ) : (

        /* EVENTS */

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {events.map((event) => (

            <div
              key={event._id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition flex flex-col"
            >

              {/* EVENT IMAGE */}

              <div className="h-48 bg-gray-200 overflow-hidden relative">

                {event.image ? (

                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />

                ) : (

                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-2xl">
                    {event.category || "Event"}
                  </div>

                )}

                {/* PRICE */}

                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm">

                  {event.price === 0 ? (

                    <span className="text-green-600">
                      FREE
                    </span>

                  ) : (

                    <span className="text-gray-900">
                      ₹{event.price}
                    </span>

                  )}

                </div>

              </div>

              {/* EVENT CONTENT */}

              <div className="p-6 flex-grow flex flex-col">

                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {event.category}
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  {event.title}
                </h2>

                {/* DATE + LOCATION */}

                <div className="flex flex-col gap-2 mb-4 text-gray-600 text-sm">

                  <div className="flex items-center gap-2">

                    <FaCalendarAlt className="text-gray-400" />

                    <span>
                      {new Date(event.date).toLocaleDateString(
                        undefined,
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>

                  </div>

                  <div className="flex items-center gap-2">

                    <FaMapMarkerAlt className="text-gray-400" />

                    <span>
                      {event.location}
                    </span>

                  </div>

                </div>

                {/* SEATS */}

                <div className="mt-auto">

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">

                    <div
                      className="bg-gray-700 h-2 rounded-full"
                      style={{
                        width: `${
                          event.totalSeats > 0
                            ? Math.min(
                                100,
                                Math.max(
                                  0,
                                  (event.availableSeats /
                                    event.totalSeats) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    {event.availableSeats} of {event.totalSeats} seats
                    remaining
                  </p>

                  {/* VIEW EVENT */}

                  <Link
                    to={`/events/${event._id}`}
                    className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg transition"
                  >
                    View Details
                  </Link>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* FOOTER */}

      <footer className="mt-auto pt-16 pb-8 border-t border-gray-200 text-center">

        <div className="flex justify-center items-center gap-2 mb-4">

          <FaTicketAlt className="text-gray-800 text-2xl" />

          <span className="text-xl font-bold text-gray-900">
            Eventora
          </span>

        </div>

        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          The simplest, most dynamic way to manage, discover, and host
          world-class events in your local city. Let's make memories together.
        </p>

        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Eventora Platform. All rights
          reserved.
        </div>

      </footer>

    </div>
  );
}

export default Home;