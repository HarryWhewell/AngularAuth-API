/**
 * Created by HWhewell on 13/01/2016.
 */

var Sequelize = require('sequelize');

// database connection
var sequelize = new Sequelize(
    'angular_auth',
    'Harry',
    'Password123',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: console.log,
        define: {
            timestamps: true
        }
    });

// load models
var models = [
    'user'
];

models.forEach(function(model){
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// export connection
module.exports.sequelize = sequelize;