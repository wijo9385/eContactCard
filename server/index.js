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

// *****************************************************
// <!-- Section 2 : Constants -->
// *****************************************************

//TODO
//var https_options = {
//	key: fs.readFileSync(process.env.PRIVATE_KEY),
//	cert: fs.readFileSync(process.env.CERTIFICATE),
//	ca: [
//		fs.readFileSync(process.env.ROOT_CA),
//		fs.readFileSync(process.env.BUNDLE_CA)
//	]
//};
var insertingProfiles = [];

function getProfileId(){
  const query = 'SELECT profile_id FROM profiles';
  var ret = db.any(query)
  .then(data => {
    var profile_ids = data.map(obj => obj.profile_id);
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var passwordLength = 20;
    var password = "";
    do {
      password = "";
      for (var i = 0; i <= passwordLength; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        password += chars.substring(randomNumber, randomNumber +1);
      }
    }while(profile_ids.includes(password));
    return password;
  });
  return ret;
}

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
      if(match) {
        const user = {
          email : data.email,
          password : data.password
        }

        req.session.user = user;

        db.one('SELECT * FROM authorize WHERE auth_id = $1', [data.auth_id])
        .then(data => {
          req.session.org_id = data.org_id;
          req.session.profile_id = data.profile_id;
          req.session.permissions = data.permissions;
          switch(data.permissions){
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
      }else{
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
  const query = 'SELECT * FROM org_to_prof RIGHT JOIN profiles ON profiles.profile_id = org_to_prof.profile_id WHERE org_id = $1;';
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
  if(req.files){
    query = 'UPDATE profiles SET image = $2, prefix = $3, first_name = $4, middle_name = $5, last_name = $6, suffix = $7, nickname = $8, title = $9, role = $10, work_url = $11, phones = $12, emails = $13, addresses = $14, birthday = $15, anniversary = $16, gender = $17, socials = $18, notes = $19 WHERE profile_id = $1 RETURNING *;';
    var prof_picture = req.files.prof_picture;
  }else{
    query = 'UPDATE profiles SET prefix = $2, first_name = $3, middle_name = $4, last_name = $5, suffix = $6, nickname = $7, title = $8, role = $9, work_url = $10, phones = $11, emails = $12, addresses = $13, birthday = $14, anniversary = $15, gender = $16, socials = $17, notes = $18 WHERE profile_id = $1 RETURNING *;';
  }
  
  const { prefix, first_name, middle_name, last_name, suffix, nickname ,title, role, work_url, emailType, email, phoneType, phone, addressType, address_line1, address_line2, city, state, postal, birthday, anniversary, gender, socialType, url, notes } = req.body;
  const profile_id = req.params.pid;

  var vcf = 'BEGIN:VCARD\nVERSION:4.0\nN:' + last_name + ';' + first_name + ';' + middle_name + ';' + prefix + ';' + suffix + '\nFN:' + first_name + ' ' + last_name + (nickname != '' ? ('\nNICKNAME:' + nickname) : "") + (birthday != '' ? '\nBDAY:' + birthday : "") + (anniversary != '' ? ('\nANNIVERSARY:' + anniversary) : "") + (gender != '' ? ('\nGENDER:' + gender) : "");

  var addresses;
  if(Array.isArray(address_line1)){
    addresses = '[';
    address_line1.forEach((elm, index) => {
      if(index != address_line1.length-1){
        vcf += '\nADR;'+ 'TYPE=' + addressType[index] + ':;' + (address_line2[index] != undefined ? address_line2[index] : "") + ';' + address_line1[index] + ';' + city[index] + ';' + state[index] + ';' + postal[index];
        addresses += '{"type":"' + addressType[index] + '","address":{"address_line1": "' + address_line1[index] + '","address_line2": "' + (address_line2[index] != undefined ? address_line2[index] : "") +'", "city":"' + city[index] + '", "state":"' + state[index] + '", "postal": "' + postal[index] + '"}},';
      }else{
        vcf += '\nADR; TYPE=' + addressType[index] + ':;' + (address_line2[index] != undefined ? address_line2[index] : "") + ';' + address_line1[index] + ';' + city[index] + ';' + state[index] + ';' + postal[index];
        addresses += '{"type":"' + addressType[index] + '","address":{"address_line1": "' + address_line1[index] + '","address_line2": "' + (address_line2[index] != undefined ? address_line2[index] : "") +'", "city":"' + city[index] + '", "state":"' + state[index] + '", "postal": "' + postal[index] + '"}}]';
      }
    });
  }else{
    vcf += '\nADR;TYPE=' + addressType + ':;' + (address_line2[index] != undefined ? address_line2[index] : "") + ';' + address_line1 + ';' + city + ';' + state + ';' + postal;
    addresses = '[{"type":"' + addressType + '", "address":{"address_line1":"' + address_line1 + '","address_line2":"' + (address_line2[index] != undefined ? address_line2[index] : "") + '","city":"' + city + '","state":"' + state + '", "postal":"' + postal + '"}}]';
  }

  var emails;
  if(Array.isArray(email)){
    emails = '[';
    email.forEach((elm, index) => {
      if(index != email.length-1){
        vcf += '\nEMAIL;TYPE=' + emailType[index] + ':' + elm; 
        emails += '{"type":"' + emailType[index] + '","email":"' + elm + '"},';
      }else{
        vcf += '\nEMAIL;TYPE=' + emailType[index] + ':' + elm; 
        emails += '{"type":"' + emailType[index] + '","email":"' + elm + '"}]';
      }
    });
  }else{
    vcf += '\nEMAIL;TYPE=' + emailType + ':' + email; 
    emails = '[{"type":"' + emailType + '","email":"' + email + '"}]'
  }
  
  var phones;
  if(Array.isArray(phone)){
    phones = '[';
    phone.forEach((elm, index) => {
      if(index != phone.length-1){
        vcf += '\nTEL;VALUE=uri;TYPE=' + phoneType[index] + ':tel:' + elm;
        phones += '{"type":"' + phoneType[index] + '","phone":"' + elm + '"},';
      }else{
        vcf += '\nTEL;VALUE=uri;TYPE=' + phoneType[index] + ':tel:' + elm;
        phones += '{"type":"' + phoneType[index] + '","phone":"' + elm + '"}]';
      }
    });
  }else{
    vcf += '\nTEL;VALUE=uri;TYPE=' + phoneType + ':tel:' + phone;
    phones = '[{"type":"' + phoneType + '","phone":"' + phone + '"}]'
  }
  
  var socials;
  if(Array.isArray(url)){
    socials = '[';
    url.forEach((elm, index) => {
      if(index != url.length-1){
        vcf += '\nURL;TYPE=' + socialType[index] + ':' + elm;
        socials += '{"type":"' + socialType[index] + '","url":"' + elm + '"},';
      }else{
        vcf += '\nURL;TYPE=' + socialType[index] + ':' + elm;
        socials += '{"type":"' + socialType[index] + '","url":"' + elm + '"}]';
      }
    });
  }else{
    vcf += '\nURL;TYPE=' + socialType + ':' + url;
    socials = '[{"type":"' + socialType + '", "url":"' + url + '"}]';
  }
  

  vcf += '\nEND:VCARD'
  if(req.files){
    db.one(query, [profile_id, profile_id + '/' + prof_picture.name, prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, phones, emails, addresses, birthday, anniversary, gender, socials, notes])
    .then((data) => {
      console.log(data);
      prof_picture.mv(__dirname + '/public/img/profile/' + profile_id + prof_picture.name);

      fs.writeFileSync(__dirname + '/public/file/' + data.profile_id + '.vcf', vcf);

      qr.toFile(__dirname + '/public/qrcodes/' + data.profile_id + '.png', process.env.BASE_URL + '/profile/' + data.profile_id);

      
      switch(req.session.permissions){
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
      switch(req.session.permissions){
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
  }else{
    db.one(query, [profile_id, prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, phones, emails, addresses, birthday, anniversary, gender, socials, notes])
    .then((data) => {
      fs.writeFileSync(__dirname + '/public/file/' + data.profile_id + '.vcf', vcf);

      qr.toFile(__dirname + '/public/qrcodes/' + data.profile_id + '.png', process.env.BASE_URL + '/profile/' + data.profile_id);

      switch(req.session.permissions){
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
      switch(req.session.permissions){
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
      socials: data.socials
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

app.post('/invite', async (req, res) => {
  var profiles_query = 'INSERT INTO profiles (profile_id, image, prefix, first_name, middle_name, last_name, suffix, nickname, title, role, work_url, phones, emails, addresses, birthday, anniversary, gender, socials, notes) VALUES ';
  await req.body.forEach(async (email, index) => {
    if(index != req.body.length - 1){
      profiles_query += '(' + await getProfileId() + ', \'images.png\', "", "", "", "", "", "", "", "", "", "[]","[{"type":"work", "email":"' + email.value + '"}]","[]","","","","[]", ""), ';
    }else{
      profiles_query += '(' + await getProfileId() + ', \'images.png\', "", "", "", "", "", "", "", "", "", "[]","[{"type":"work", "email":"' + email.value + '"}]","[]","","","","[]", "") RETURNING profile_id;';
    }
  });
  db.any(profiles_query)
  .then(data => {
    var authorize_query = 'INSERT INTO authorize (profile_id, org_id, permissions) VALUES ';
    var org_to_prof_query = 'INSERT INTO org_to_prof (org_id, profile_id) VALUES ';
    req.body.forEach((email, index) => {
      if(index != req.body.length - 1){
        authorize_query += '(' + data[index].profile_id + ',' + req.session.org_id + ', user), '
        org_to_prof_query += '(' + req.session.org_id + ',' + data[index].profile_id +'), '
      }else{
        authorize_query += '(' + data[index].profile_id + ',' + req.session.org_id + ', user) RETURNING auth_id;'
        org_to_prof_query += '(' + req.session.org_id + ',' + data[index].profile_id +');'
      }
    });
    db.any(authorize_query)
    .then(data => {
      var users_query = 'INSERT INTO users (email, auth_id, password) VALUES ';
      req.body.forEach((email, index) => {
        if(index != req.body.length - 1){
          users_query += '(' + email.value + ',' + data[index].auth_id + ', "$2y$10$PH1ZaESDM7vo.p67Tyrd2OxZUVvuZ9NrBdtmCAiyRY5hd79bgajpq"), ';
        }else{
          users_query += '(' + email.value + ',' + data[index].auth_id + ', "$2y$10$PH1ZaESDM7vo.p67Tyrd2OxZUVvuZ9NrBdtmCAiyRY5hd79bgajpq");';
        }
      });
      db.none(users_query);
    });
    db.none(org_to_prof_query);
  })
  res.redirect('/profiles');
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
	if(err) console.log('ERROR: ' + err);
	console.log('Server is listening on port 3000')
});
// https.createServer(https_options, app).listen(3000);
