import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUsers } from "react-icons/fa";

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

const categoryIcons = {
  festival: "🎉",
  meeting: "🤝",
  sports: "⚽",
  cultural: "🎭",
  maintenance: "🔧",
  other: "📅",
};

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const { user } = useSelector((state) => state.auth);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const query = filterStatus ? `?status=${filterStatus}` : "";
      const res = await API.get(`/events${query}`);
      setEvents(res.data.events || []);
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  const handleRSVP = async (eventId) => {
    try {
      setRsvpLoading(eventId);
      const res = await API.put(`/events/${eventId}/rsvp`);
      toast.success(res.data.message);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || "RSVP failed");
    } finally {
      setRsvpLoading(null);
    }
  };

  const isRSVPed = (event) =>
    event.rsvpList?.some(
      (r) => (r.user?._id || r.user)?.toString() === user?._id?.toString()
    );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Events</h1>
          <p className="text-gray-500 text-sm mt-1">
            Society events and activities
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl">
          <FaCalendarAlt className="text-primary-500" />
          <span className="text-sm font-medium text-primary-700">
            {events.filter((e) => e.status === "upcoming").length} Upcoming
          </span>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "upcoming", "ongoing", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filterStatus === s
                ? "bg-primary-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary-400"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FaCalendarAlt className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No events found</p>
          <p className="text-gray-400 text-sm mt-1">
            Check back later for upcoming events
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const rsvped = isRSVPed(event);
            const isFull =
              event.maxAttendees > 0 &&
              event.rsvpList?.length >= event.maxAttendees &&
              !rsvped;
            const canRSVP =
              event.status === "upcoming" || event.status === "ongoing";

            return (
              <div
                key={event._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {categoryIcons[event.category] || "📅"}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-800 leading-tight">
                        {event.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[event.status]}`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaCalendarAlt className="text-primary-400 flex-shrink-0" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaClock className="text-primary-400 flex-shrink-0" />
                    <span>
                      {event.startTime} — {event.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaMapMarkerAlt className="text-primary-400 flex-shrink-0" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaUsers className="text-primary-400 flex-shrink-0" />
                    <span>
                      {event.rsvpList?.length || 0} attending
                      {event.maxAttendees > 0
                        ? ` / ${event.maxAttendees} max`
                        : ""}
                    </span>
                  </div>
                </div>

                {/* RSVP Button */}
                {canRSVP && (
                  <button
                    onClick={() => handleRSVP(event._id)}
                    disabled={rsvpLoading === event._id || isFull}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                      rsvpLoading === event._id
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isFull
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : rsvped
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    {rsvpLoading === event._id
                      ? "Processing..."
                      : isFull
                        ? "Event Full"
                        : rsvped
                          ? "✓ RSVPed — Click to Cancel"
                          : "RSVP to this Event"}
                  </button>
                )}
                {!canRSVP && (
                  <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center bg-gray-50 text-gray-400 capitalize">
                    Event {event.status}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyEvents;
