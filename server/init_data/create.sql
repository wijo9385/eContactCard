DROP TABLE IF EXISTS organizations CASCADE;

CREATE TABLE IF NOT EXISTS organizations (
  org_id SERIAL PRIMARY KEY,
  logo TEXT,
  name TEXT
);

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(50) PRIMARY KEY,
  auth_id NUMERIC, -- owner, admin, user
  password VARCHAR(60)
);

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS profiles (
  profile_id VARCHAR(60) PRIMARY KEY,
  image TEXT,
  prefix TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  suffix TEXT,
  nickname TEXT,
  title TEXT,
  role TEXT,
  work_url TEXT,
  phones JSON,
  emails JSON,
  addresses JSON,
  birthday TEXT,
  anniversary TEXT,
  gender TEXT,
  socials JSON,
  notes TEXT
);

DROP TABLE IF EXISTS authorize CASCADE;

CREATE TABLE IF NOT EXISTS authorize (
  auth_id SERIAL PRIMARY KEY,
  profile_id VARCHAR(60),
  org_id NUMERIC,
  permissions VARCHAR(4) -- ownr, admn, user
);

DROP TABLE IF EXISTS org_to_prof CASCADE;

CREATE TABLE IF NOT EXISTS org_to_prof (
  org_id NUMERIC,
  profile_id VARCHAR(60)
);