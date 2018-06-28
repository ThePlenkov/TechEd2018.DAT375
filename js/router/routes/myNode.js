/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
var express = require("express");

module.exports = function() {
	var app = express.Router();

	app.get("/", (req, res) => {
		return res.type("text/plain").status(200).send("Hello World Node.js");
	});

	app.get("/example1", (req, res) => {
		var scope = `${req.authInfo.xsappname}.Display`;
		if (req.authInfo && !req.authInfo.checkScope(scope)) {
			return res.type("text/plain").status(403).send("Forbidden");
		}

		let client = req.db;
		client.prepare(
			`SELECT SESSION_USER, CURRENT_SCHEMA 
				             FROM "DUMMY"`,
			(err, statement) => {
				if (err) {
					return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				}
				statement.exec([],
					(err, results) => {
						if (err) {
							return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
						} else {
							var result = JSON.stringify({
								Objects: results
							});
							return res.type("application/json").status(200).send(result);
						}
					});
				return null;
			});
		return null;
	});

	//Simple Database Call Stored Procedure
	app.get("/products", (req, res) => {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		//(client, Schema, Procedure, callback)
		hdbext.loadProcedure(client, null, "build_products", (err, sp) => {
			if (err) {
				return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
			}
			//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
			sp({}, (err, parameters, results) => {
				if (err) {
					return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				}
				let out = [];
				for (let item of results) {
					out.push([item.PRODUCTID, item.CATEGORY, item.PRICE]);
				}
				var excel = require("node-xlsx");
				var excelOut = excel.build([{
					name: "Products",
					data: out
				}]);
				res.header("Content-Disposition", "attachment; filename=Excel.xlsx");
				return res.type("application/vnd.ms-excel").status(200).send(excelOut);
			});
			return null;
		});
	});

	app.get("/sflightExt", (req, res) => {
		var scope = `${req.authInfo.xsappname}.Display`;
		if (req.authInfo && !req.authInfo.checkScope(scope)) {
			return res.type("text/plain").status(403).send("Forbidden");
		}

		let client = req.db;
		client.prepare(
			`SELECT TOP 100 *   
			        FROM "FLIGHT.SflightExt"`,
			(err, statement) => {
				if (err) {
					return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				}
				statement.exec([],
					(err, results) => {
						if (err) {
							return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
						} else {
							return res.type("application/json").status(200).send(JSON.stringify(results));
						}
					});
				return null;
			});
		return null;
	});

	//Security Context via Passport
	app.get("/passport", (req, res) => {
		res.type("application/json").status(200).send(JSON.stringify(req.authInfo));
	});
	
	return app;
};