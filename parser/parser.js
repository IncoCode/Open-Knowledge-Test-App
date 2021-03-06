var program = require('commander');
var fs = require('fs');
var Waterline = require('waterline');
var waterline = new Waterline();
var dbConfig = require('./config');
var request = require('request');
var parse = require('./parse');
var model = require('../api/models/Transaction');

program
    .option('-u, --url <url>', 'URL')
    .option('-f, --file <path>', 'File path')
    .option('-h --host <host>', 'Mongo host')
    .option('-p --port <port>', 'Mongo port')
    .option('-u --user <user>', 'Mongo user')
    .option('-p --password <password>', 'Mongo password')
    .option('-d --database <database>', 'Mongo database')
    .parse(process.argv);

if (program.host) dbConfig.connections.mongo.host = program.host;
if (program.port) dbConfig.connections.mongo.port = program.port;
if (program.user) dbConfig.connections.mongo.user = program.user;
if (program.password) dbConfig.connections.mongo.password = program.password;
if (program.database) dbConfig.connections.mongo.database = program.database;

model.identity = 'transaction';
model.connection = 'mongo';
var transactionModel = Waterline.Collection.extend(model);

waterline.loadCollection(transactionModel);
waterline.initialize(dbConfig, function (err, ontology) {
    if (err) return console.error(err);

    var Transaction = ontology.collections.transaction;

    if (program.file) {
        parse(fs.readFileSync(program.file).toString(), Transaction);
    }
    else if (program.url) {
        request.get(program.url, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                parse(body, Transaction);
            }
        });
    } else {
        console.log('You should specify -u (--url) or -f (--file) parameters!');
        process.abort(1);
    }
});
