import "global/config.js"
import "@/config"
import express from 'express'
import userRoute from '@routes/userRoute';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cookieParser())
app.use("/user", userRoute)


app.listen(
    PORT,
    () => console.log(`resource server live on http://localhost:${PORT}`)
)