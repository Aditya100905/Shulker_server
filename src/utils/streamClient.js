import dotenv from "dotenv";
import { StreamClient } from "@stream-io/node-sdk";

dotenv.config();

const client = new StreamClient(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

export default client;
