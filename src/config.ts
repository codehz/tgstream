import dotenv from "dotenv"

dotenv.config()

export default {
  API_ID: +process.env.API_ID,
  API_HASH: process.env.API_HASH,
  SESSION: process.env.TELEGRAM_SESSION,
}