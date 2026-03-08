import "dotenv/config";

const host = process.env.HOST || "192.168.8.102";
const http = (port) => `http://${host}:${port}`;

export default ({ config }) => ({
  ...config,
  extra: {
    HOST: host,
    API_BASE_URL: http(8000),
    WATER_BASE_URL: http(8006),
    ML_BASE_URL: http(8001),
    SPOILAGE_BASE_URL: http(8002),
    DEVICE_BASE_URL: http(8010),
    LEAF_HEALTH_BASE_URL: http(8003),
  },
});