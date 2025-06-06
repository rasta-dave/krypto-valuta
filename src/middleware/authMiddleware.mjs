import { verifyToken } from '../auth/jwtUtils.mjs';
import UserModel from '../database/models/UserModel.mjs';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'You are not logged in. Please log in to get access.',
      });
    }

    const decoded = verifyToken(token);

    const currentUser = await UserModel.findById(decoded.id).select(
      '+password'
    );
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Your account has been deactivated.',
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid token. Please log in again.',
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};
