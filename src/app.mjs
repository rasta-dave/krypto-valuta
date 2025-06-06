import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth-routes.mjs';

dotenv.config();

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.headers.cookie) {
    const cookies = {};
    req.headers.cookie.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
    req.cookies = cookies;
  } else {
    req.cookies = {};
  }
  next();
});

app.use((req, res, next) => {
  res.cookie = (name, value, options = {}) => {
    const cookieString =
      `${name}=${value}; ` +
      Object.entries(options)
        .map(([key, val]) => {
          if (key === 'expires' && val instanceof Date) {
            return `expires=${val.toUTCString()}`;
          }
          if (typeof val === 'boolean') {
            return val ? key : '';
          }
          return `${key}=${val}`;
        })
        .filter(Boolean)
        .join('; ');

    res.setHeader('Set-Cookie', cookieString);
  };
  next();
});

app.use('/api/auth', authRoutes);
