import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'default-super-secret-key';

export default function (req, res, next) {
  // Get token from the header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // The header format is "Bearer TOKEN"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ msg: 'Token format is invalid, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload to the request object
    req.user = decoded.user;
    next(); // Move to the next piece of middleware or the route handler
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}