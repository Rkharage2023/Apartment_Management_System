import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      // Check session validity
      if (
        decoded.sessionToken &&
        req.user.sessionToken &&
        decoded.sessionToken !== req.user.sessionToken
      ) {
        return res.status(401).json({
          message:
            "Your session has expired because your account was logged in from another device.",
        });
      }

      // Touch lastActive timestamp silently
      req.user.lastActive = new Date();
      req.user.isLoggedIn = true;
      await req.user.save({ validateBeforeSave: false });

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, not authorized" });
  }
};

export default protect; // ✅ default export — not named export
