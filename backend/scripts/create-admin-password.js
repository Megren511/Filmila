const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'Admin@123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Hashed password for admin:', hash);
}

hashPassword();
