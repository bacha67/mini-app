import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

function getConnectionString() {
  let url = process.env.DATABASE_URL;
  if (!url) return url;

  // Automatically encode unescaped '#' in password before '@' host section
  const lastAtIndex = url.lastIndexOf('@');
  if (lastAtIndex !== -1) {
    const userInfoPart = url.substring(0, lastAtIndex);
    const hostPart = url.substring(lastAtIndex);
    const fixedUserInfo = userInfoPart.replace(/#/g, '%23');
    url = fixedUserInfo + hostPart;
  }
  return url;
}

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
