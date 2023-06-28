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
const { auth, requiresAuth } = require('express-openid-connect');
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

// *****************************************************
// <!-- Section 3 : Configuration -->
// *****************************************************

const oauthConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SESSION_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: 'UJQURSSMY2CHBsp01Gorw5f01WASZNIf',
  issuerBaseURL: 'https://dev-bjbpa30gxml1zhod.us.auth0.com'
}

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
app.use(auth(oauthConfig));

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
app.get('/card/:username', (req, res) => {
    const username = req.params.username;
    const query = 'SELECT * FROM cards WHERE username = $1;';

    db.one(query, [username])
    .then(data => {
      res.render('pages/card', {
        username: username,
        image: data.image,
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title,
        phone: data.phone,
        email: data.email,
        address_line1: data.address_line1,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode
      });
    })
    .catch(err => {
      console.error(err);
    });
});

app.get('/', (req, res) => {
  const query = 'SELECT * FROM cards;';
  db.any(query)
  .then(data => {
    res.render('pages/main', {
      cards: data,
      base_url: process.env.BASE_URL
    });
  })
  .catch(err => {
    console.log(err);
  });
  
});

app.post('/', (req, res) => {
  const query = 'INSERT INTO cards (username, image, first_name, last_name, title, phone, email, address_line1, city, state, zipcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;';
  const profile = req.files.profile;

  db.one(query, [req.body.username, req.files.profile.name, req.body.first_name, req.body.last_name, req.body.title, req.body.phone, req.body.email, req.body.address_line1, req.body.city, req.body.state, req.body.zipcode])
    .then((data) => {
      profile.mv(__dirname + '/public/img/profile/' + profile.name);

      const content = "BEGIN:VCARD\nVERSION:3.0\nFN: "+ data.first_name + " " + data.last_name + "\nN: " + data.last_name + "; " + data.first_name + ";;;\nEMAIL;TYPE=INTERNET;TYPE=WORK:" + data.email + "\nTEL;TYPE=WORK:" + data.phone + "\nADR:;;" + data.address_line1 + "; " + data.city + "; " + data.state + ";"+ data.zipcode +";US\nitem1.ORG:University of Colorado Boulder\nitem1.X-ABLabel:\nitem2.TITLE:" + data.title + "\nitem2.X-ABLabel:\nEND:VCARD";

      fs.writeFileSync(__dirname + '/public/file/' + data.username + '.vcf', content);

      qr.toFile(__dirname + '/public/qrcodes/' + data.username + '.png', process.env.BASE_URL + '/card/' + data.username);

      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/');
    });
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
