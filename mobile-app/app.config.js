import "dotenv/config";

const host = process.env.HOST || "192.168.8.102";
const http = (port) => `http://${host}:${port}`;
const diseaseApiUrl = process.env.DISEASE_API_URL || http(8001);

export default ({ config }) => ({
  ...config,
  extra: {
    HOST: host,
    API_BASE_URL: http(8000),
    WATER_BASE_URL: http(8003),
    ML_BASE_URL: http(8004),
    SPOILAGE_BASE_URL: http(8002),
    DEVICE_BASE_URL: http(8010),
    DISEASE_API_URL: diseaseApiUrl,
    LEAF_HEALTH_BASE_URL: diseaseApiUrl,
  },
});
