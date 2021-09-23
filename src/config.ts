import dotenv from "dotenv"

dotenv.config()

export default {
  API_ID: +process.env.API_ID,
  API_HASH: process.env.API_HASH,
  COOKIES: process.env.YTB_COOKIES,
  SESSION: process.env.TELEGRAM_SESSION,
}