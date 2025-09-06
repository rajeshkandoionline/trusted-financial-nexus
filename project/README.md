# CA Firm Management System

Enterprise-grade platform for Indian Chartered Accountant practices.

## Structure
- frontend/
- backend/
- database/
- documentation/
- tests/

## Quickstart
See documentation/setup.md
EOF
; cat > /workspace/project/.env.sample <<\"EOF\"
# Server
PORT=8080
NODE_ENV=development
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

# Database
MONGODB_URI=mongodb://localhost:27017/ca_firm
MONGODB_TEST_URI=mongodb://localhost:27017/ca_firm_test

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="CA Firm <noreply@cafirm.local>"

# File Storage
FILE_STORAGE=local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=

# CORS
CORS_ORIGIN=http://localhost:5173
EOF
; cat > /workspace/project/backend/server.js <<\"EOF\"
import express from express;
import cors from cors;
import helmet from helmet;
import morgan from morgan;
import cookieParser from cookie-parser;
import dotenv from dotenv;
import mongoose from mongoose;

import { errorHandler, notFound } from ./middleware/error.js;
import authRouter from ./routes/auth.routes.js;

dotenv.config({ path: new URL(../.env, import.meta.url).pathname });

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(,) || *, credentials: true }));
app.use(express.json({ limit: 2mb }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(dev));

app.get(/api/health, (req, res) => res.json({ status: ok }));
app.use(/api/auth, authRouter);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGODB_URI || mongodb://localhost:27017/ca_firm;

async function start() {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => console.log(`Server running on :${port}`));
  } catch (err) {
    console.error(Startup
