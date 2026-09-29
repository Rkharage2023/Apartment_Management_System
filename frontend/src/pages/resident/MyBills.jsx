import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaMoneyBill,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaReceipt,
  FaPrint,
  FaCreditCard,
  FaQrcode,
  FaUniversity,
} from "react-icons/fa";

const MyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
  });

  // Payment Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingBill, setPayingBill] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    method: "card",
    cardNo: "",
    expiry: "",
    cvv: "",
    upiId: "",
    bankName: "HDFC Bank",
  });

  // Receipt Modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptBill, setReceiptBill] = useState(null);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payingBill) return;

    if (paymentDetails.method === "card") {
      if (!paymentDetails.cardNo || !paymentDetails.expiry || !paymentDetails.cvv) {
        toast.error("Please fill all card details");
        return;
      }
    } else if (paymentDetails.method === "upi") {
      if (!paymentDetails.upiId) {
        toast.error("Please enter your UPI ID");
        return;
      }
    }

    try {
      setPaymentLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const txnId = `TXN_${paymentDetails.method.toUpperCase()}_${Date.now()}`;

      const res = await API.put(`/billing/${payingBill._id}/pay-online`, {
        paymentMethod: paymentDetails.method,
        transactionId: txnId,
      });

      toast.success(res.data.message || "Payment successful!");
      setShowPayModal(false);
      
      // Auto open receipt after successful payment
      setReceiptBill({
        ...payingBill,
        status: "paid",
        paidAt: new Date(),
        paymentMethod: paymentDetails.method,
        transactionId: txnId,
      });
      setShowReceiptModal(true);

      setPayingBill(null);
      setPaymentDetails({
        method: "card",
        cardNo: "",
        expiry: "",
        cvv: "",
        upiId: "",
        bankName: "HDFC Bank",
      });
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterMonth) {
        // Convert "2026-07" -> "July-2026"
        const [year, month] = filterMonth.split("-");
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const formatted = `${monthNames[parseInt(month, 10) - 1]}-${year}`;
        params.append("month", formatted);
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await API.get(`/billing/my-bills${queryString}`);
      const fetchedBills = res.data.bills || [];
      setBills(fetchedBills);

      setSummary({
        total: fetchedBills.length,
        paid: fetchedBills.filter((b) => b.status === "paid").length,
        unpaid: fetchedBills.filter((b) => b.status === "unpaid").length,
        overdue: fetchedBills.filter((b) => b.status === "overdue").length,
      });
    } catch (error) {
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filterStatus, filterMonth]);

  const statusColors = {
    unpaid: "bg-amber-100 text-amber-700 border-amber-200",
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    overdue: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const statusIcons = {
    paid: <FaCheckCircle className="text-emerald-500" />,
    unpaid: <FaClock className="text-amber-500" />,
    overdue: <FaExclamationTriangle className="text-rose-500" />,
  };

  const totalDue = bills
    .filter((b) => b.status !== "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaMoneyBill className="text-primary-600" /> My Bills & Digital Receipts
        </h1>
        <p className="text-gray-500 text-sm mt-1">View, pay maintenance bills, and access printable payment receipts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Bills",
            value: summary.total,
            color: "bg-blue-50 text-blue-700 border-blue-100",
            icon: <FaMoneyBill />,
          },
          {
            label: "Paid",
            value: summary.paid,
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
            icon: <FaCheckCircle />,
          },
          {
            label: "Unpaid",
            value: summary.unpaid,
            color: "bg-amber-50 text-amber-700 border-amber-100",
            icon: <FaClock />,
          },
          {
            label: "Overdue",
            value: summary.overdue,
            color: "bg-rose-50 text-rose-700 border-rose-100",
            icon: <FaExclamationTriangle />,
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 border ${s.color}`}>
            <div className="flex items-center gap-2 mb-2 text-lg">{s.icon}</div>
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Total Due Banner */}
      {totalDue > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-rose-500 text-2xl" />
            <div>
              <p className="font-bold text-rose-800">Outstanding Maintenance Charges</p>
              <p className="text-xs text-rose-600">
                You have pending invoices totaling ₹{totalDue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700">
            ₹{totalDue.toLocaleString("en-IN")}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
        >
          <option value="">All Payment Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <input
          type="text"
          placeholder="Filter by month (e.g. April-2026)"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
        />
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <FaMoneyBill className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bills found for the selected criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-xs">
                    {statusIcons[b.status]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 capitalize text-base">
                      {b.billType} Bill
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Period: <span className="font-semibold text-gray-700">{b.month}</span> • Flat {b.flat?.flatNumber || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-gray-900">
                      ₹{b.amount?.toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold border capitalize mt-1 ${statusColors[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {b.status !== "paid" ? (
                      <button
                        onClick={() => {
                          setPayingBill(b);
                          setShowPayModal(true);
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                      >
                        Pay Online
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setReceiptBill(b);
                          setShowReceiptModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition"
                      >
                        <FaReceipt className="text-primary-600" /> Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <span>Due Date: {new Date(b.dueDate).toLocaleDateString("en-IN")}</span>
                {b.paidAt && <span>Paid on: {new Date(b.paidAt).toLocaleDateString("en-IN")}</span>}
                {b.note && <span>Note: {b.note}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pay Online Gateway Modal */}
      {showPayModal && payingBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-700 to-primary-900 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold">Secure Payment Gateway</h2>
                  <p className="text-xs text-primary-200 mt-1 capitalize">
                    {payingBill.billType} invoice for {payingBill.month}
                  </p>
                </div>
                <button
                  onClick={() => { if (!paymentLoading) setShowPayModal(false); }}
                  className="text-white/80 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">Total Payable Amount</span>
                <span className="text-2xl font-black text-primary-700">
                  ₹{payingBill.amount?.toLocaleString("en-IN")}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Select Payment Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "card", label: "Card", icon: <FaCreditCard /> },
                    { id: "upi", label: "UPI ID / QR", icon: <FaQrcode /> },
                    { id: "netbanking", label: "NetBanking", icon: <FaUniversity /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentDetails({ ...paymentDetails, method: m.id })}
                      className={`flex flex-col items-center justify-center gap-1 py-3 border rounded-xl text-xs font-semibold transition ${
                        paymentDetails.method === m.id
                          ? "border-primary-600 bg-primary-50 text-primary-700 shadow-xs"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentDetails.method === "card" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      maxLength="19"
                      placeholder="4111 2222 3333 4444"
                      value={paymentDetails.cardNo}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          cardNo: e.target.value.replace(/\s?/g, "").replace(/(\d{4})/g, "$1 ").trim(),
                        })
                      }
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        maxLength="5"
                        placeholder="MM/YY"
                        value={paymentDetails.expiry}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength="3"
                        placeholder="123"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentDetails.method === "upi" && (
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    placeholder="user@upi / mobile@okaxis"
                    value={paymentDetails.upiId}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">A payment request will be sent to your UPI App.</p>
                </div>
              )}

              {paymentDetails.method === "netbanking" && (
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Select Bank</label>
                  <select
                    value={paymentDetails.bankName}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 shadow-sm"
                >
                  {paymentLoading ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && receiptBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FaReceipt className="text-primary-600" /> Payment Receipt
                </h2>
                <p className="text-xs text-gray-400">Official Society Maintenance Invoice Receipt</p>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm" id="printable-receipt">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <p className="font-extrabold text-base text-gray-900">Apartment Management System</p>
                  <p className="text-xs text-gray-500">Unit: {receiptBill.flat?.flatNumber || "N/A"}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">
                    PAID
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-400">Transaction Ref</p>
                  <p className="font-mono font-semibold text-gray-800">{receiptBill.transactionId || `TXN_${receiptBill._id}`}</p>
                </div>
                <div>
                  <p className="text-gray-400">Payment Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(receiptBill.paidAt || Date.now()).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Bill Type</p>
                  <p className="font-semibold text-gray-800 capitalize">{receiptBill.billType} Bill</p>
                </div>
                <div>
                  <p className="text-gray-400">Billing Period</p>
                  <p className="font-semibold text-gray-800">{receiptBill.month}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-700">Amount Paid</span>
                <span className="text-xl font-black text-emerald-600">₹{receiptBill.amount?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
              >
                <FaPrint /> Print Receipt
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyBills;
