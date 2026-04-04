import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaCalendarAlt, FaEdit, FaTrash } from "react-icons/fa";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
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
  });

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
    setFormData({
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
    });
    setEditData(null);
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditData(event);
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        society: event.society?._id || "",
        venue: event.venue,
        eventDate: new Date(event.eventDate).toISOString().split("T")[0],
        startTime: event.startTime,
        endTime: event.endTime,
        maxAttendees: event.maxAttendees,
        isRSVPRequired: event.isRSVPRequired,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.society ||
      !formData.venue ||
      !formData.eventDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (editData) {
        await API.put(`/events/${editData._id}`, formData);
        toast.success("Event updated");
      } else {
        await API.post("/events", {
          ...formData,
          maxAttendees: Number(formData.maxAttendees),
        });
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <div
              key={e._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[e.status]}`}
                >
                  {e.status}
                </span>
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
              <h3 className="font-semibold text-gray-800 mb-1">{e.title}</h3>
              <p className="text-xs text-gray-400 mb-2 capitalize">
                {e.category}
              </p>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {e.description}
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>📍 {e.venue}</p>
                <p>📅 {new Date(e.eventDate).toLocaleDateString("en-IN")}</p>
                <p>
                  🕐 {e.startTime} — {e.endTime}
                </p>
                <p>
                  👥 {e.rsvpList?.length || 0} / {e.maxAttendees || "∞"} RSVPs
                </p>
              </div>

              {/* Status Actions */}
              {e.status === "upcoming" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => handleStatusUpdate(e._id, "ongoing")}
                    className="flex-1 text-xs py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(e._id, "cancelled")}
                    className="flex-1 text-xs py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {e.status === "ongoing" && (
                <button
                  onClick={() => handleStatusUpdate(e._id, "completed")}
                  className="w-full mt-4 pt-3 border-t border-gray-50 text-xs py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Mark Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editData ? "Edit Event" : "Add Event"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Event title"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
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
                  placeholder="Event description"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
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
                      "festival",
                      "meeting",
                      "sports",
                      "cultural",
                      "maintenance",
                      "other",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue *
                </label>
                <input
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  placeholder="Society Garden"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    placeholder="10:00 AM"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    placeholder="02:00 PM"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) =>
                      setFormData({ ...formData, maxAttendees: e.target.value })
                    }
                    placeholder="100"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="rsvp"
                    checked={formData.isRSVPRequired}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRSVPRequired: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600"
                  />
                  <label
                    htmlFor="rsvp"
                    className="text-sm font-medium text-gray-700"
                  >
                    RSVP Required
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  {editData ? "Update" : "Create"}
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
