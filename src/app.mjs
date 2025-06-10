import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { generalLimiter } from './middleware/rateLimitMiddleware.mjs';
import { sanitizeInput } from './middleware/sanitizationMiddleware.mjs';
import { errorHandler, notFound } from './middleware/errorMiddleware.mjs';
import authRoutes from './routes/auth-routes.mjs';
import blockchainRoutes from './routes/blockchain-routes.mjs';
import walletRoutes from './routes/wallet-routes.mjs';
import transactionRoutes from './routes/transaction-routes.mjs';

dotenv.config();

export const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(generalLimiter);

app.use(cookieParser());

app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Invalid JSON',
        });
        return;
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ key, req }) => {
      console.warn(
        `Potential NoSQL injection attempt blocked: ${key} in ${req.path}`
      );
    },
  })
);

app.use(
  hpp({
    whitelist: ['sort', 'fields', 'page', 'limit'],
  })
);

app.use(sanitizeInput);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(`${req.method} ${req.path} - ${req.ip} - ${req.requestTime}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/blocks', blockchainRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);

app.use(notFound);
app.use(errorHandler);

export { notFound, errorHandler };
