CREATE OR REPLACE FUNCTION pseudo_encrypt(value int) returns int AS $$
DECLARE
l1 int;
l2 int;
r1 int;
r2 int;
i int:=0;
BEGIN
 l1:= (value >> 16) & 65535;
 r1:= value & 65535;
 WHILE i < 3 LOOP
   l2 := r1;
   r2 := l1 # ((((1366 * r1 + 150889) % 714025) / 714025.0) * 32767)::int;
   l1 := l2;
   r1 := r2;
   i := i + 1;
 END LOOP;
 return ((r1 << 16) + l1);
END;
$$ LANGUAGE plpgsql strict immutable;

CREATE OR REPLACE FUNCTION stringify_bigint(n bigint) RETURNS text
    LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
 alphabet text:='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 base int:=length(alphabet); 
 _n bigint:=abs(n);
 output text:='';
BEGIN
 LOOP
   output := output || substr(alphabet, 1+(_n%base)::int, 1);
   _n := _n / base; 
   EXIT WHEN _n=0;
 END LOOP;
 RETURN output;
END $$;

DROP TABLE IF EXISTS organizations CASCADE;

CREATE TABLE IF NOT EXISTS organizations (
  org_id SERIAL PRIMARY KEY,
  logo TEXT,
  name TEXT
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  name TEXT,
  profile_id VARCHAR(60),
  scans NUMERIC
);

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(50) PRIMARY KEY,
  auth_id NUMERIC, -- owner, admin, user
  password VARCHAR(60)
);

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS profiles (
  profile_id TEXT PRIMARY KEY,
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
  notes TEXT,
  active BOOLEAN
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

DROP TABLE IF EXISTS invites CASCADE;

CREATE TABLE IF NOT EXISTS invites (
  email TEXT,
  profile_id VARCHAR(60) PRIMARY KEY
);