import 'global/config'
import "@/config"
import express from 'express'
import jwtRoute from '@routes/jwtRoute';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000
const corsOptions = {
    origin: "*",
    credentials: true
}

app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

app.use("/auth", jwtRoute)

app.listen(
    PORT,
    () => console.log(`auth server live on http://localhost:${PORT}`)
)