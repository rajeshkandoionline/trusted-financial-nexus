import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

import { errorHandler, notFound } from './middleware/error.js';
import authRouter from './routes/auth.routes.js';

// Load environment from project root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || '*').split(','),
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca_firm';

async function start() {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;

