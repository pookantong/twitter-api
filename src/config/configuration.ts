export default () => ({
  PORT: process.env.PORT,
  DB: {
    URI: process.env.DATABASE_URI,
  },
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
    REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES,
  },
});
