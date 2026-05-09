import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
} from "react-icons/fa";

// ✅ Venue options
const VENUE_OPTIONS = [
  { value: "Society Garden", label: "🌿 Society Garden" },
  { value: "Community Hall", label: "🏛️ Community Hall" },
  { value: "Rooftop Terrace", label: "🌇 Rooftop Terrace" },
  { value: "Swimming Pool Area", label: "🏊 Swimming Pool Area" },
  { value: "Children Play Area", label: "🎠 Children Play Area" },
  { value: "Conference Room", label: "💼 Conference Room" },
  { value: "Other", label: "📍 Other (Custom)" },
];

// ✅ Time options from 6:00 AM to 11:00 PM
const generateTimeOptions = () => {
  const times = [];
  const periods = ["AM", "PM"];

  for (let period of periods) {
    const startHour = period === "AM" ? 6 : 12;
    const endHour = period === "AM" ? 12 : 12;

    for (let hour = startHour; hour <= (period === "AM" ? 11 : 11); hour++) {
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      times.push({
        value: `${displayHour}:00 ${period}`,
        label: `${displayHour}:00 ${period}`,
      });
      times.push({
        value: `${displayHour}:30 ${period}`,
        label: `${displayHour}:30 ${period}`,
      });
    }
  }

  // Clean structured list
  return [
    { value: "6:00 AM", label: "6:00 AM — Early Morning" },
    { value: "6:30 AM", label: "6:30 AM" },
    { value: "7:00 AM", label: "7:00 AM — Morning" },
    { value: "7:30 AM", label: "7:30 AM" },
    { value: "8:00 AM", label: "8:00 AM" },
    { value: "8:30 AM", label: "8:30 AM" },
    { value: "9:00 AM", label: "9:00 AM" },
    { value: "9:30 AM", label: "9:30 AM" },
    { value: "10:00 AM", label: "10:00 AM" },
    { value: "10:30 AM", label: "10:30 AM" },
    { value: "11:00 AM", label: "11:00 AM" },
    { value: "11:30 AM", label: "11:30 AM" },
    { value: "12:00 PM", label: "12:00 PM — Noon" },
    { value: "12:30 PM", label: "12:30 PM" },
    { value: "1:00 PM", label: "1:00 PM — Afternoon" },
    { value: "1:30 PM", label: "1:30 PM" },
    { value: "2:00 PM", label: "2:00 PM" },
    { value: "2:30 PM", label: "2:30 PM" },
    { value: "3:00 PM", label: "3:00 PM" },
    { value: "3:30 PM", label: "3:30 PM" },
    { value: "4:00 PM", label: "4:00 PM" },
    { value: "4:30 PM", label: "4:30 PM" },
    { value: "5:00 PM", label: "5:00 PM — Evening" },
    { value: "5:30 PM", label: "5:30 PM" },
    { value: "6:00 PM", label: "6:00 PM" },
    { value: "6:30 PM", label: "6:30 PM" },
    { value: "7:00 PM", label: "7:00 PM — Night" },
    { value: "7:30 PM", label: "7:30 PM" },
    { value: "8:00 PM", label: "8:00 PM" },
    { value: "8:30 PM", label: "8:30 PM" },
    { value: "9:00 PM", label: "9:00 PM" },
    { value: "9:30 PM", label: "9:30 PM" },
    { value: "10:00 PM", label: "10:00 PM — Late Night" },
    { value: "10:30 PM", label: "10:30 PM" },
    { value: "11:00 PM", label: "11:00 PM" },
  ];
};

const TIME_OPTIONS = generateTimeOptions();

const Events = () => {
  const [events, setEvents] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [customVenue, setCustomVenue] = useState("");

  const defaultForm = {
    title: "",
    description: "",
    category: "other",
    society: "",
    venue: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    maxAttendees: "",
    isRSVPRequired: false,
  };

  const [formData, setFormData] = useState(defaultForm);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get("/events");
      setEvents(res.data.events);
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await API.get("/societies");
      setSocieties(res.data.societies);
    } catch (error) {}
  };

  useEffect(() => {
    fetchEvents();
    fetchSocieties();
  }, []);

  const resetForm = () => {
    setFormData(defaultForm);
    setCustomVenue("");
    setEditData(null);
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditData(event);
      const isCustomVenue = !VENUE_OPTIONS.find((v) => v.value === event.venue);
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        society: event.society?._id || "",
        venue: isCustomVenue ? "Other" : event.venue,
        eventDate: new Date(event.eventDate).toISOString().split("T")[0],
        startTime: event.startTime,
        endTime: event.endTime,
        maxAttendees: event.maxAttendees,
        isRSVPRequired: event.isRSVPRequired,
      });
      if (isCustomVenue) setCustomVenue(event.venue);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const getFinalVenue = () => {
    if (formData.venue === "Other") return customVenue;
    return formData.venue;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const venue = getFinalVenue();

    if (
      !formData.title ||
      !formData.society ||
      !venue ||
      !formData.eventDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.venue === "Other" && !customVenue.trim()) {
      toast.error("Please enter a custom venue name");
      return;
    }

    try {
      const payload = {
        ...formData,
        venue,
        maxAttendees: Number(formData.maxAttendees) || 0,
      };

      if (editData) {
        await API.put(`/events/${editData._id}`, payload);
        toast.success("Event updated");
      } else {
        await API.post("/events", payload);
        toast.success("Event created");
      }
      setShowModal(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/events/${id}/status`, { status });
      toast.success(`Event marked as ${status}`);
      fetchEvents();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await API.delete(`/events/${id}`);
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const statusColors = {
    upcoming: "bg-blue-100 text-blue-600",
    ongoing: "bg-green-100 text-green-600",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
  };

  const categoryEmojis = {
    festival: "🎉",
    meeting: "📋",
    sports: "⚽",
    cultural: "🎭",
    maintenance: "🔧",
    other: "📌",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Events</h1>
          <p className="text-gray-500 text-sm mt-1">Manage society events</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Add Event
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FaCalendarAlt className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No events found</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-3 text-primary-600 text-sm font-medium hover:underline"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <div
              key={e._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{categoryEmojis[e.category]}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[e.status]}`}
                  >
                    {e.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(e)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleDelete(e._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-800 mb-3">{e.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {e.description}
              </p>

              <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                  <span>{e.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-gray-400 flex-shrink-0" />
                  <span>
                    {new Date(e.eventDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="text-gray-400 flex-shrink-0" />
                  <span>
                    {e.startTime} — {e.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUsers className="text-gray-400 flex-shrink-0" />
                  <span>
                    {e.rsvpList?.length || 0}
                    {e.maxAttendees > 0
                      ? ` / ${e.maxAttendees} RSVPs`
                      : " RSVPs"}
                  </span>
                </div>
              </div>

              {/* Status Actions */}
              {e.status === "upcoming" && (
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => handleStatusUpdate(e._id, "ongoing")}
                    className="flex-1 text-xs py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium"
                  >
                    ▶ Start Event
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(e._id, "cancelled")}
                    className="flex-1 text-xs py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    ✕ Cancel
                  </button>
                </div>
              )}
              {e.status === "ongoing" && (
                <button
                  onClick={() => handleStatusUpdate(e._id, "completed")}
                  className="w-full mt-3 pt-3 border-t border-gray-50 text-xs py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  ✓ Mark Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ Event Modal with Venue + Time Dropdowns */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editData ? "Edit Event" : "Add Event"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Holi Celebration 2026"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe the event..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Category + Society */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[
                      { value: "festival", label: "🎉 Festival" },
                      { value: "meeting", label: "📋 Meeting" },
                      { value: "sports", label: "⚽ Sports" },
                      { value: "cultural", label: "🎭 Cultural" },
                      { value: "maintenance", label: "🔧 Maintenance" },
                      { value: "other", label: "📌 Other" },
                    ].map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Society *
                  </label>
                  <select
                    value={formData.society}
                    onChange={(e) =>
                      setFormData({ ...formData, society: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select</option>
                    {societies.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ Venue Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue *
                </label>
                <select
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Venue --</option>
                  {VENUE_OPTIONS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>

                {/* Custom venue input if "Other" selected */}
                {formData.venue === "Other" && (
                  <input
                    value={customVenue}
                    onChange={(e) => setCustomVenue(e.target.value)}
                    placeholder="Enter custom venue name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mt-2"
                  />
                )}

                {/* Venue preview */}
                {formData.venue && formData.venue !== "Other" && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Venue:{" "}
                    {
                      VENUE_OPTIONS.find((v) => v.value === formData.venue)
                        ?.label
                    }
                  </p>
                )}
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* ✅ Start Time + End Time Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <select
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Start Time --</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <select
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- End Time --</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration Preview */}
              {formData.startTime && formData.endTime && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <FaClock className="text-blue-500 text-sm" />
                  <p className="text-xs text-blue-600">
                    Event timing:{" "}
                    <span className="font-semibold">{formData.startTime}</span>{" "}
                    to <span className="font-semibold">{formData.endTime}</span>
                  </p>
                </div>
              )}

              {/* Max Attendees + RSVP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxAttendees: e.target.value,
                      })
                    }
                    placeholder="0 = unlimited"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <div
                    onClick={() =>
                      setFormData({
                        ...formData,
                        isRSVPRequired: !formData.isRSVPRequired,
                      })
                    }
                    className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${
                      formData.isRSVPRequired ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        formData.isRSVPRequired
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </div>
                  <label className="text-sm font-medium text-gray-700 cursor-pointer">
                    RSVP Required
                  </label>
                </div>
              </div>

              {/* Event Summary */}
              {formData.title &&
                formData.venue &&
                formData.eventDate &&
                formData.startTime && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Event Preview
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {categoryEmojis[formData.category]} {formData.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {getFinalVenue() || "Venue not set"}
                    </p>
                    <p className="text-xs text-gray-500">
                      📅{" "}
                      {formData.eventDate
                        ? new Date(formData.eventDate).toLocaleDateString(
                            "en-IN",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "Date not set"}
                    </p>
                    {formData.startTime && formData.endTime && (
                      <p className="text-xs text-gray-500">
                        🕐 {formData.startTime} — {formData.endTime}
                      </p>
                    )}
                    {formData.maxAttendees > 0 && (
                      <p className="text-xs text-gray-500">
                        👥 Max {formData.maxAttendees} attendees
                      </p>
                    )}
                    {formData.isRSVPRequired && (
                      <p className="text-xs text-primary-600 mt-1">
                        ✅ RSVP Required
                      </p>
                    )}
                  </div>
                )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  {editData ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Events;
