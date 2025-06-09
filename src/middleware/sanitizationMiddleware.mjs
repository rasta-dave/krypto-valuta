import validator from 'validator';
import xss from 'xss';

export const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = validator.escape(obj[key]);
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  if (req.query) {
    sanitizeObject(req.query);
  }

  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

export const validateTransactionInput = (req, res, next) => {
  const { amount, recipient } = req.body;

  if (!amount || !recipient) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Amount and recipient are required',
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Amount must be a positive number',
    });
  }

  if (amount > 1000000) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Amount cannot exceed 1,000,000',
    });
  }

  if (typeof recipient !== 'string' || recipient.length < 10) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Recipient must be a valid address',
    });
  }

  next();
};

export const validateAuthInput = (req, res, next) => {
  const { email, password, username } = req.body;

  if (email && !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Please provide a valid email address',
    });
  }

  if (password && password.length < 6) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Password must be at least 6 characters long',
    });
  }

  if (username && (username.length < 3 || username.length > 30)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Username must be between 3 and 30 characters',
    });
  }

  next();
};
