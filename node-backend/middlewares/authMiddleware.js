// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

export const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ error: "No token, authorization denied" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // If roles array is empty → allow all authenticated users
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Access denied : Not Authorized" });
      }
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };
};
