import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export const formatDate = (date) => format(new Date(date), "dd MMM yyyy");

export const formatDateTime = (date) =>
  format(new Date(date), "dd MMM yyyy, hh:mm a");

export const timeAgo = (date) => {
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return "Yesterday";
  return formatDate(d);
};
