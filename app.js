
var express = require('express');
//var path = require('path');
//var http = require('http');
var csvr = require('csv-parser');
var csvw = require('csv-writer');
var fs = require('fs');

var rows = null;
var config = null;
var spec_keys = null;
var specs = null;

var app = new express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
io.sockets.on('connection', (socket) => {

	if (config && specs && rows) {
		socket.emit("db_res", {title:config.corpus_name, rows:rows, specs:specs, delim:config.output_delim });
	} else {
		config = {};
		fs.createReadStream('data/config.csv')
			.pipe(csvr({ headers: false, separator: ',' }))
			.on('data', (row) => {
				if (Object.keys(row).length == 2)
					config[row[0]] = row[1];
			})
			.on('end', () => {
				specs = {};
				spec_keys = [];
				//specs = [];
				fs.createReadStream(config.usage_path)
					.pipe(csvr({ headers: false, separator: config.usage_delim }))
					//.pipe(csvr({ headers: true, separator: config.usage_delim }))
					.on('data', (row) => {
						//specs.push(row);
						if (spec_keys.length == 0) {
							spec_keys = Object.values(row);
						} else {
							specs[row[0]] = {};
							for (var i=1; i<spec_keys.length; i++) {
								if (row[i].length > 0 && !isNaN(row[i])) row[i] = parseInt(row[i]);
								specs[row[0]][spec_keys[i]] = row[i];
							}
						}
						//console.log("##########", row);
						//for (var key in Object.keys(row))
						//	console.log("#####", key);
					})
					.on('end', () => {
						console.log(specs);
						socket.on("db_req", function(data) {
							rows = [];
							fs.createReadStream(config.corpus_path)
								.pipe(csvr({ headers: false, separator: config.corpus_delim }))
								.on('data', (row) => {
									rows.push(Object.values(row));
								})
								.on('end', () => {
									console.log('CSV file successfully processed');
									socket.emit("db_res", {title:config.corpus_name, rows:rows, specs:specs, delim:config.output_delim });
								});
						});
					});
			});
	}

	socket.on("save", function(data) {
		fs.writeFile("public/"+data.filename, data.content, function(err){
			if (err) return console.log(err);
			console.log(data.filename);
			socket.emit(data.filename, {});
		});
	});

	socket.on("modify", function(data) {
		//console.log(data, rows[data.row][data.col]);
		rows[data.row][data.col] = data.val;
	});

});

app.use(express.static(__dirname+'/public'));

app.get('/', function(request, response){
	response.sendFile(__dirname+'/public/main.html');
	//response.sendFile('main.html');
});

/*http.createServer(function(req, res) {

	res.writeHead(200, {
		'Content-Type': 'text/html'
	});

	//res.write('<!doctype html>\n<html lang="en">\n' + 
	//	'\n<meta charset="utf-8">\n<title>Test web page on node.js</title>\n' + 
	//	'<style type="text/css">* {font-family:arial, sans-serif;}</style>\n' + 
	//	'\n\n<h1>Euro 2012 teams</h1>\n' + 
	//	'<div id="content"><p>The teams in Group D for Euro 2012 are:</p><ul><li>England</li><li>France</li><li>Sweden</li><li>Ukraine</li></ul></div>' + 
	//	'\n\n');

	res.write('<!doctype html>\n<html lang="en">\n' + 
		'\n<meta charset="utf-8">\n<title>Test web page on node.js</title>\n' + 
		'<style type="text/css">* {font-family:arial, sans-serif;}\ntr:nth-child(even) {background-color: #f2f2f2;}</style>\n')

	res.write('<table>');

	//var rows = [];
	fs.createReadStream('data/lexiconP_Shortend_length_roots_frequencies.csv')
		.pipe(csvr({ headers: false, separator : '\t' }))
		.on('data', (row) => {
			//console.log(row);
			//res.write('<p>'+row[7]+'</p>');
			//res.write('<p>'+Object.values(row).join(' ')+'</p>');
			res.write('<tr><td>'+Object.values(row).join('</td><td>')+'</td></tr>');
			//rows.push(row);
		})
		.on('end', () => {
			console.log('CSV file successfully processed');
			res.write('</table>');
			res.end();
		});

	//res.end();

}).listen(8888, '127.0.0.1');*/

//app.listen(8888);
server.listen(8888);

//var server = http.createServer();
//server.listen(8888);

console.log('Server running at http://127.0.0.1:8888');
