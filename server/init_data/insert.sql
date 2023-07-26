INSERT INTO profiles (profile_id, image, prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, phones, emails, addresses, birthday, anniversary, gender, socials, notes, active) VALUES ('aEmBnyaoINsie', 'IMG_1923.jpeg', '', 'William', 'C', 'Johnson', '', 'Will', 'Student Assistant', '', 'https://www.colorado.edu', '[{"type":"cell","phone":"+17204634762"}]', '[{"type":"work", "email":"wijo9385exc@colorado.edu"},{"type":"school", "email":"wijo9385@colorado.edu"},{"type":"home", "email":"will.i.am.johnson80122@gmail.com"}]','[{"type":"home", "address":{"address_line1":"120 S 34th St", "address_line2":"","city":"Boulder","state":"CO", "postal":"80302"}}, {"type":"work", "address":{"address_line1":"1305 University Ave", "address_line2":"","city":"Boulder","state":"CO", "postal":"80305"}}]', '2002-09-01', '', 'M', '[{"type":"LinkedIn","url":"https://www.linkedin.com/in/william-johnson-504675218/"},{"type":"Instagram","url":"https://instagram.com/will.johnso.n"}]', '', 'true');

INSERT INTO organizations (logo, name) VALUES ('logo.png', 'University of Colorado Boulder');

INSERT INTO users (email, auth_id, password) VALUES ('wijo9385exc@colorado.edu', 1, '$2y$10$9CPtzavx6u8kEr0OSi6LCOnOg6M.rolppnZMPEj9LZjsY3xsyIMN6');

INSERT INTO authorize (profile_id, org_id, permissions) VALUES ('aEmBnyaoINsie', 0, 'user');

INSERT INTO org_to_prof (org_id, profile_id) VALUES (0, 'aEmBnyaoINsie');