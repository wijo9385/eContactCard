// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require("express"); // To build an application server or API
const https = require('https');
const app = express();
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require("bcrypt"); //  To hash passwords
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part B.
const { json } = require("body-parser");
const fileUpload = require('express-fileupload');
const fs = require("fs");
const qr = require('qrcode');
const nodemailer = require("nodemailer");

// *****************************************************
// <!-- Section 2 : Constants -->
// *****************************************************

//TODO
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'will.i.am.johnson80122@gmail.com',
    pass: 'hijheofobfhnwrzl'
  }
});

// *****************************************************
// <!-- Section 3 : Configuration -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 4 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

app.use(fileUpload());
// app.use(auth(oauthConfig));

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use("/public", express.static("public"));
// *****************************************************
// <!-- Section 5 : API Routes -->
// *****************************************************

//TODO
app.get('/p/:pid', (req, res) => {
  const query = 'SELECT * FROM profiles WHERE profile_id = $1;';
  const profile_id = req.params.pid;
  if (req.query.shid) {
    const update_qr = 'UPDATE qr_codes SET scans = scans + 1 WHERE id = $1;';
    const share_id = req.query.shid;

    db.task(task => {
      return task.batch([
        task.one(query, [profile_id]),
        task.none(update_qr, [share_id])
      ])
    })
      .then(data => {
        res.render('pages/card', {
          profile_id: data[0].profile_id,
          image: data[0].image,
          prefix: data[0].prefix,
          first_name: data[0].first_name,
          middle_name: data[0].middle_name,
          last_name: data[0].last_name,
          suffix: data[0].last_name,
          title: data[0].title,
          work_url: data[0].work_url,
          phones: data[0].phones,
          emails: data[0].emails,
          addresses: data[0].addresses,
          socials: data[0].socials,
          notes: data[0].notes
        });
      })
      .catch(err => {
        console.error(err);
      });
  } else {
    db.one(query, [profile_id])
      .then(data => {
        res.render('pages/card', {
          profile_id: data.profile_id,
          image: data.image,
          prefix: data.prefix,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          suffix: data.last_name,
          title: data.title,
          work_url: data.work_url,
          phones: data.phones,
          emails: data.emails,
          addresses: data.addresses,
          socials: data.socials,
          notes: data.notes
        });
      })
      .catch(err => {
        console.error(err);
      });
  }
});

app.get('/invite', (req, res)=>{
  if(req.query.q){
    const query = 'SELECT * FROM invites WHERE profile_id = $1;';

    db.one(query, [req.query.q])
    .then(data => {
      res.render('pages/invite', {
        email: data.email,
        profile_id: req.query.q
      })
    })
    .catch(err => {
      console.log(err);
    })
  }else{
    res.redirect('/login');
  }
});

app.post('/inv', (req, res)=>{
  if(req.query.q){
    if(req.body.password == req.body.confirm_password){
      const auth_query = 'INSERT INTO authorize (profile_id, org_id, permissions) VALUES ($1, 0, \'user\') RETURNING auth_id;';

      db.one(auth_query, [req.query.q])
      .then(async data => {
        const user_query = 'INSERT INTO users (email, auth_id, password) VALUES ($1, $2, $3);';
        const update_profile = "UPDATE profiles SET active = 'true' WHERE profile_id = $1;";
        db.task(async task => {
          return task.batch([
            task.none(user_query, [req.body.email, data.auth_id, await bcrypt.hash(req.body.password, 10)]),
            task.none(update_profile, [req.query.q])
          ])
        })
        .then(() => {
          res.redirect('/login');
        })
      })
      .catch(err => {
        console.log(err);
      })
    }else{
      res.redirect(req.header('Referer') || '/login')
    }
  }else{
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const query = "select * from users where email = $1";

  db.one(query, [email])
    .then((data) => {
      const match = bcrypt.compare(data.password, password)
      if (match) {
        const user = {
          email: data.email,
          password: data.password
        }

        req.session.user = user;

        db.one('SELECT * FROM authorize WHERE auth_id = $1', [data.auth_id])
          .then(data => {
            req.session.org_id = data.org_id;
            req.session.profile_id = data.profile_id;
            req.session.permissions = data.permissions;
            switch (data.permissions) {
              case 'ownr':
                res.redirect('/profiles');
                break;
              case 'admn':
                res.redirect('/profiles');
                break;
              case 'user':
                res.redirect('/user');
                break;
              default:
                throw Error('\'permissions\' is undefined');
            }
          })
          .catch(err => {
            throw Error(err);
          });
      } else {
        throw Error('Couldn\'t find email or password');
      }
    })
    .catch((err) => {
      res.render("pages/login", {
        error: "danger",
        message: err,
      });
    });
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

app.use(auth);

app.get('/profiles', (req, res) => {
  const query = 'SELECT * FROM profiles;';
  db.any(query, [req.session.org_id])
    .then(data => {
      res.render('pages/profiles', {
        user_email: req.session.user.email,
        profiles: data,
        base_url: process.env.BASE_URL
      });
    })
    .catch(err => {
      console.log(err);
    });
});

app.post('/profiles/:pid', (req, res) => {
  var query;
  if (req.files) {
    query = 'UPDATE profiles SET image = $2, prefix = $3, first_name = $4, middle_name = $5, last_name = $6, suffix = $7, nickname = $8, title = $9, role = $10, work_url = $11, phones = $12, emails = $13, addresses = $14, birthday = $15, anniversary = $16, gender = $17, socials = $18, notes = $19 WHERE profile_id = $1 RETURNING *;';
    var prof_picture = req.files.prof_picture;
  } else {
    query = 'UPDATE profiles SET prefix = $2, first_name = $3, middle_name = $4, last_name = $5, suffix = $6, nickname = $7, title = $8, role = $9, work_url = $10, phones = $11, emails = $12, addresses = $13, birthday = $14, anniversary = $15, gender = $16, socials = $17, notes = $18 WHERE profile_id = $1 RETURNING *;';
  }

  const { prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, emailType, email, phoneType, phone, addressType, address_line1, address_line2, city, state, postal, birthday, anniversary, gender, socialType, url, notes } = req.body;
  const profile_id = req.params.pid;

  var vcf = 'BEGIN:VCARD\nVERSION:4.0\nN:' + last_name + ';' + first_name + ';' + middle_name + ';' + prefix + ';' + suffix + '\nFN:' + first_name + ' ' + last_name + (nickname != '' ? ('\nNICKNAME:' + nickname) : "") + (birthday != '' ? '\nBDAY:' + birthday : "") + (anniversary != '' ? ('\nANNIVERSARY:' + anniversary) : "") + (gender != '' ? ('\nGENDER:' + gender) : "");

  var addresses;
  if (Array.isArray(address_line1)) {
    addresses = '[';
    address_line1.forEach((elm, index) => {
      if (index != address_line1.length - 1) {
        vcf += '\nADR;' + 'TYPE=' + addressType[index] + ':;' + (address_line2[index] != undefined ? address_line2[index] : "") + ';' + address_line1[index] + ';' + city[index] + ';' + state[index] + ';' + postal[index];
        addresses += '{"type":"' + addressType[index] + '","address":{"address_line1": "' + address_line1[index] + '","address_line2": "' + (address_line2[index] != undefined ? address_line2[index] : "") + '", "city":"' + city[index] + '", "state":"' + state[index] + '", "postal": "' + postal[index] + '"}},';
      } else {
        vcf += '\nADR; TYPE=' + addressType[index] + ':;' + (address_line2[index] != undefined ? address_line2[index] : "") + ';' + address_line1[index] + ';' + city[index] + ';' + state[index] + ';' + postal[index];
        addresses += '{"type":"' + addressType[index] + '","address":{"address_line1": "' + address_line1[index] + '","address_line2": "' + (address_line2[index] != undefined ? address_line2[index] : "") + '", "city":"' + city[index] + '", "state":"' + state[index] + '", "postal": "' + postal[index] + '"}}]';
      }
    });
  } else if(address_line1 != '') {
    vcf += '\nADR;TYPE=' + addressType + ':;' + (address_line2 != undefined ? address_line2 : "") + ';' + address_line1 + ';' + city + ';' + state + ';' + postal;
    addresses = '[{"type":"' + addressType + '", "address":{"address_line1":"' + address_line1 + '","address_line2":"' + (address_line2 != undefined ? address_line2 : "") + '","city":"' + city + '","state":"' + state + '", "postal":"' + postal + '"}}]';
  }

  var emails;
  if (Array.isArray(email)) {
    emails = '[';
    email.forEach((elm, index) => {
      if (index != email.length - 1) {
        vcf += '\nEMAIL;TYPE=' + emailType[index] + ':' + elm;
        emails += '{"type":"' + emailType[index] + '","email":"' + elm + '"},';
      } else {
        vcf += '\nEMAIL;TYPE=' + emailType[index] + ':' + elm;
        emails += '{"type":"' + emailType[index] + '","email":"' + elm + '"}]';
      }
    });
  } else if(email != '') {
    vcf += '\nEMAIL;TYPE=' + emailType + ':' + email;
    emails = '[{"type":"' + emailType + '","email":"' + email + '"}]'
  }

  var phones;
  if (Array.isArray(phone)) {
    phones = '[';
    phone.forEach((elm, index) => {
      if (index != phone.length - 1) {
        vcf += '\nTEL;VALUE=uri;TYPE=' + phoneType[index] + ':tel:' + elm;
        phones += '{"type":"' + phoneType[index] + '","phone":"' + elm + '"},';
      } else {
        vcf += '\nTEL;VALUE=uri;TYPE=' + phoneType[index] + ':tel:' + elm;
        phones += '{"type":"' + phoneType[index] + '","phone":"' + elm + '"}]';
      }
    });
  } else if (phone != '') {
    vcf += '\nTEL;VALUE=uri;TYPE=' + phoneType + ':tel:' + phone;
    phones = '[{"type":"' + phoneType + '","phone":"' + phone + '"}]'
  }

  var socials;
  if (Array.isArray(url)) {
    socials = '[';
    url.forEach((elm, index) => {
      if (index != url.length - 1) {
        vcf += '\nURL;TYPE=' + socialType[index] + ':' + elm;
        socials += '{"type":"' + socialType[index] + '","url":"' + elm + '"},';
      } else {
        vcf += '\nURL;TYPE=' + socialType[index] + ':' + elm;
        socials += '{"type":"' + socialType[index] + '","url":"' + elm + '"}]';
      }
    });
  } else if (url != '') {
    vcf += '\nURL;TYPE=' + socialType + ':' + url;
    socials = '[{"type":"' + socialType + '", "url":"' + url + '"}]';
  }


  vcf += '\nEND:VCARD'
  if (req.files) {
    db.one(query, [profile_id, profile_id + prof_picture.name, prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, phones, emails, addresses, birthday, anniversary, gender, socials, notes])
      .then((data) => {
        console.log(data);
        prof_picture.mv(__dirname + '/public/img/profile/' + profile_id + prof_picture.name);

        fs.writeFileSync(__dirname + '/public/file/' + data.profile_id + '.vcf', vcf);

        qr.toFile(__dirname + '/public/qrcodes/' + data.profile_id + '.png', process.env.BASE_URL + '/profile/' + data.profile_id);


        switch (req.session.permissions) {
          case 'ownr':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'admn':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'user':
            res.redirect('/user');
            break;
          default:
            throw Error('\'permissions\' is undefined');
        }
      })
      .catch(err => {
        console.log(err);
        switch (req.session.permissions) {
          case 'ownr':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'admn':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'user':
            res.redirect('/user');
            break;
          default:
            throw Error('\'permissions\' is undefined');
        }
      });
  } else {
    db.one(query, [profile_id, prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, phones, emails, addresses, birthday, anniversary, gender, socials, notes])
      .then((data) => {
        fs.writeFileSync(__dirname + '/public/file/' + data.profile_id + '.vcf', vcf);

        switch (req.session.permissions) {
          case 'ownr':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'admn':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'user':
            res.redirect('/user');
            break;
          default:
            throw Error('\'permissions\' is undefined');
        }
      })
      .catch(err => {
        console.log(err);
        switch (req.session.permissions) {
          case 'ownr':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'admn':
            res.redirect('/profiles/' + data.profile_id);
            break;
          case 'user':
            res.redirect('/user');
            break;
          default:
            throw Error('\'permissions\' is undefined');
        }
      });
  }
});

app.post('/delete', (req, res) => {
  const query = 'DELETE FROM profiles WHERE profile_id = $1;';
  const auth_query = 'DELETE FROM authorize WHERE profile_id = $1 RETURNING *;';
  const user_query = 'DELETE FROM users WHERE auth_id = $1;';
  const profile_id = req.body.profile_id;

  db.task(task => {
    return task.batch([
      db.none(query, [profile_id]),
      db.one(auth_query, [profile_id])
    ]);
  })
  .then(data => {
    db.none(user_query, [data[1].auth_id]);
    res.redirect('/profiles');
  })
  .catch(err => {
    console.log(err);
    res.redirect('/profiles');
  });
});

app.get('/profiles/:profile_id', (req, res) => {
  const query = 'SELECT * FROM profiles WHERE profile_id = $1;';
  const profile_id = req.params.profile_id;

  db.one(query, [profile_id])
    .then(data => {
      res.render('pages/profile', {
        user_email: req.session.user.email,
        profile_id: data.profile_id,
        image: data.image,
        prefix: data.prefix,
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        suffix: data.suffix,
        nickname: data.nickname,
        title: data.title,
        role: data.role,
        work_url: data.work_url,
        phones: data.phones,
        emails: data.emails,
        addresses: data.addresses,
        birthday: data.birthday,
        anniversary: data.anniversary,
        gender: data.gender,
        socials: data.socials,
        active: data.active
      })
    })
});

app.get('/user', (req, res) => {
  const query = 'SELECT * FROM profiles WHERE profile_id = $1;';

  db.one(query, [req.session.profile_id])
    .then(data => {
      res.render('pages/user', {
        user_email: req.session.user.email,
        profile_id: data.profile_id,
        image: data.image,
        prefix: data.prefix,
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        suffix: data.suffix,
        nickname: data.nickname,
        title: data.title,
        role: data.role,
        work_url: data.work_url,
        phones: data.phones,
        emails: data.emails,
        addresses: data.addresses,
        birthday: data.birthday,
        anniversary: data.anniversary,
        gender: data.gender,
        socials: data.socials
      })
    })
});

app.get('/qrcodes/:pid', (req, res) => {
  const query = 'SELECT * FROM profiles WHERE profile_id = $1;';
  const qrcodes = 'SELECT * FROM qr_codes WHERE profile_id = $1;';
  const profile_id = req.params.pid;

  db.task(task => {
    return task.batch([
      task.one(query, [profile_id]),
      task.any(qrcodes, [profile_id])
    ])
  })
    .then(data => {
      res.render('pages/qrcodes', {
        user_email: req.session.user.email,
        profile_id: data[0].profile_id,
        qrcodes: data[1]
      })
    })
    .catch(err => {
      console.log(err);
      res.redirect('/profiles');
    });
});

app.get('/qrcodes', (req, res) => {
  const qrcodes = 'SELECT * FROM qr_codes;';

  db.any(qrcodes)
  .then(data => {
    res.render('pages/qrcodes_all', {
      user_email: req.session.user.email,
      qrcodes: data
    })
  })
});

app.post('/qrcodes/:pid', (req, res) => {
  const query = "INSERT INTO qr_codes (name, profile_id, scans) VALUES ($1, $2, $3) RETURNING *;";
  const profile_id = req.params.pid;

  db.one(query, [req.body.name, profile_id, 0])
    .then(data => {
      qr.toFile(__dirname + '/public/qrcodes/' + data.profile_id + '_' + data.id + '.png', process.env.BASE_URL + '/p/' + data.profile_id + "?shid=" + data.id);
      res.redirect('/qrcodes/' + profile_id);
    })
});

app.post('/invite', (req, res) => {
  const { first_name, last_name, email } = req.body;
  const query = "INSERT INTO profiles (profile_id, image, prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, phones, emails, addresses, birthday, anniversary, gender, socials, notes, active) VALUES (stringify_bigint(pseudo_encrypt(floor(random() * 10 + 1)::int)), 'images.png', '', $1, '', $2, '', '', '', '', '', '[]', $3 ,'[]', '', '', '', '[]', '', 'false') RETURNING profile_id;";
  const invite_query = "INSERT INTO invites (email, profile_id) VALUES ($1, $2) RETURNING profile_id;";

  

  db.one(query, [first_name, last_name, '[{"type":"work", "email":"' + email + '"}]'])
  .then(data => {
    db.one(invite_query, [email, data.profile_id])
    .then(async (data) => {

      console.log(data);

      const send_email = {
        from: 'wijo9385exc@colorado.edu', // sender address
        to: email, // list of receivers
        subject: "Make an Account", // Subject line
        html: "<b>Hello world?</b><br><a href='" + process.env.BASE_URL + "/invite?q=" + data.profile_id + "'>Click Here!</a>", // html body
      }

      const info = await transporter.sendMail(send_email);
      console.log(info);

      res.redirect('/profiles');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/profiles')
    })
  })
  .catch(err => {
    console.log(err);
    res.redirect('/profiles')
  })
});

app.post('/qrcode', (req, res) => {
  const query = "INSERT INTO qr_codes (name, profile_id, scans) VALUES ($1, $2, $3) RETURNING *;";
  const profile_id = req.session.profile_id;

  db.one(query, [req.body.name, profile_id, 0])
    .then(data => {
      qr.toFile(__dirname + '/public/qrcodes/' + data.profile_id + '_' + data.id + '.png', process.env.BASE_URL + '/p/' + data.profile_id + "?shid=" + data.id);
      res.redirect('/qrcode');
    })
});

app.get('/qrcode', (req, res) => {
  const query = 'SELECT * FROM profiles WHERE profile_id = $1;';
  const qrcodes = 'SELECT * FROM qr_codes WHERE profile_id = $1;';
  const profile_id = req.session.profile_id;

  db.task(task => {
    return task.batch([
      task.one(query, [profile_id]),
      task.any(qrcodes, [profile_id])
    ])
  })
    .then(data => {
      res.render('pages/qrcode', {
        user_email: req.session.user.email,
        profile_id: data[0].profile_id,
        qrcodes: data[1]
      })
    })
    .catch(err => {
      console.log(err);
      res.redirect('/profiles');
    });
});

app.get('/permissions/:pid', (req, res) => {
  const query = 'SELECT * FROM authorize WHERE profile_id = $1;';
  const profile_id = req.params.pid;

  db.one(query, [profile_id])
  .then((data) => {
    res.status(200).json(data);
  })
  .catch(err => {
    console.log(err);
  })
});

app.post('/permissions/:pid', (req, res) => {
  const query = 'UPDATE authorize SET permissions = $1 WHERE profile_id = $2;';
  const profile_id = req.params.pid;

  db.none(query, [req.body.permissions, profile_id])
  .then(() => {
    res.redirect('/profiles/' + profile_id);
  })
  .catch(err => {
    console.log(err);
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});
// *****************************************************
// <!-- Section 6 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000, (err) => {
  if (err) console.log('ERROR: ' + err);
  console.log('Server is listening on port 3000')
});
// https.createServer(https_options, app).listen(3000);
