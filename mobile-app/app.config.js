import "dotenv/config";

const ALB_HOST = "hydroponic-backend-alb-1973402541.us-east-1.elb.amazonaws.com";
const ALB_BASE = `http://${ALB_HOST}`;
const withPort = (port) => `${ALB_BASE}:${port}`;
const defaultDiseaseUrl = withPort(8001);

export default ({ config }) => ({
  ...config,
  extra: {
    HOST: process.env.HOST || ALB_HOST,
    API_BASE_URL: process.env.API_BASE_URL || ALB_BASE,
    WATER_BASE_URL: process.env.WATER_BASE_URL || withPort(8003),
    ML_BASE_URL: process.env.ML_BASE_URL || withPort(8004),
    SPOILAGE_BASE_URL: process.env.SPOILAGE_BASE_URL || withPort(8002),
    DEVICE_BASE_URL: process.env.DEVICE_BASE_URL || withPort(8010),
    DISEASE_API_URL: process.env.DISEASE_API_URL || defaultDiseaseUrl,
    LEAF_HEALTH_BASE_URL:
      process.env.LEAF_HEALTH_BASE_URL || process.env.DISEASE_API_URL || defaultDiseaseUrl,
  },
});
