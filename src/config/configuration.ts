export default () => ({
  port: process.env.PORT,
  mongodb: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    expires: process.env.JWT_EXPIRES,
    secret: process.env.JWT_SECRET,
  },
});