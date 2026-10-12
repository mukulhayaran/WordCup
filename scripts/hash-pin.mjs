import bcrypt from "bcryptjs";

const pin = process.argv[2];
if (!pin || !/^\d{4}$/.test(pin)) {
  console.error("Usage: node scripts/hash-pin.mjs 1234");
  process.exit(1);
}

const hash = bcrypt.hashSync(pin, 12);
console.log(hash);
