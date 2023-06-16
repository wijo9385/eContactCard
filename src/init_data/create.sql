DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY,
  password VARCHAR(60) NOT NULL
);

DROP TABLE IF EXISTS cards CASCADE;

CREATE TABLE IF NOT EXISTS cards (
  username VARCHAR(50) PRIMARY KEY,
  name TEXT,
  title TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT
);
