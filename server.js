/**
 * Created by HWhewell on 13/01/2016.
 */
// BASE SETUP
// =============================================================================
// call the packages needed
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');

// configure app to use bodyParser()
// this allows getting data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// set the port
var port = process.env.PORT || 8080;

// set up the models
app.set('models', require('./app/models'));
var User = app.get('models').user;

//set secret
app.set('superSecret', 'harryjameswhewell');

// ROUTES FOR OUR API
// =============================================================================

var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Request being made.');

    // allow cross platform access
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    next(); // make sure to go to the next routes and don't stop here
});

router.get('/', function(req, res){
    res.json({ message: 'Welcome to the Adventure-Store API' });
});

// AUTHENTICATE ROUTES ----------------------------------
router.route('/authenticate')
    .post(function(req,res){
        var user = User.build();
        var email = req.body.email;
        var password = req.body.password;
        user.retrieveByEmail(email, function(returnedUser){
            var payload = {
                "iss": "auth-api",
                "aud": "user",
                "id": returnedUser.id,
                "name": returnedUser.name,
                "role": returnedUser.role
            };

            bcrypt.compare(password, returnedUser.password, function(err, resp){
                if(resp == true){
                    if(returnedUser){
                        var token = jwt.sign( payload,app.get('superSecret'),{
                            expiresIn: 86400
                        });
                        res.json({
                            success: true,
                            token: token
                        })
                    } else {
                        res.json({ success: false, message: 'Authentication failed. Wrong Email' });
                    }
                }
                else{
                    res.json({ success: false, message: 'Authentication failed. Wrong Password' });
                }
            });
        },function(err){
            res.json({ success: false, message: 'Authentication failed. Wrong Email' });
        })
    });



// USER POST ROUTES -----------------------------
router.route('/users')
    // create user
    .post(function(req, res){
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;
        var role = req.body.role;

        var user = User.build({name: name, email: email, password: password, role: role});
        user.add(function(){
            res.json({message: 'User created!'});
        },function(err){
            res.send(err);
        });
    });

// ROUTE MIDDLEWARE --------------------------
router.use(function(req,res,next){

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if(token){
        jwt.verify(token, app.get('superSecret'), function(err, decoded){
            if(err){
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});


// USER GET ROUTES ---------------------------
router.route('/users')
    // get all users
    .get(function(req, res){
        var user = User.build();
        user.retrieveAll(function(users){
            if(users){
                res.json(users);
            }else{
                res.status(401).send( "User not found");
            }
        }, function(err){
            res.send(err  + ":User not found");
        })
    });
// all routes are prefixed with /api
app.use('/api', router);
// START THE SERVER
// =============================================================================

app.listen(port);
console.log('Server launched on port ' + port);