'use strict';

// ** Constants
const DEFAULT_METHODS = ['GET'];

// ** Dependencies
const util = require('util');
const _ = require('underscore');
const PATH = require('path');
const express = require('express');
const path = require('path');

// ** Libraries
const Interface = require('../lib/Interface');

// ** Platform
const errors = require('nodus-framework').errors;
const logger = require('nodus-framework').logger;

/**
 * Provides a RESTful HTTP interface
 */
class RestExpressInterface extends Interface {
    constructor(name, options, config) {
        super(name, options, config);

        // ** Load configuration properties
        this.host = config.host;
        this.port = config.port;
        this.basePath = config.basePath;

        // ** Create HTTP Server
        this.api = restify.createServer({
            name: this.basePaths
        });

        this.api.use(restify.CORS());  // CORS support
        this.api.use(restify.dateParser());
        this.api.use(restify.queryParser());
        this.api.use(restify.bodyParser());
        this.api.use(restify.gzipResponse());

        // this.api.use(restify.auditLogger({
        //     log: logger
        // }));

        // ** Map Nodus-Framework error codes to status codes
        const send_error = (res, next) => err => {
            if (typeof(err) == 'undefined') {
                return res.send(500, errors(500, 'Internal error - with no error :S').toObject());
            }
            if (!err.code) {
                return res.send(500, errors(500, 'Internal error', err).toObject());
            }
            if (err.code === 'NO_HANDLER') {
                res.send(404, err);
                // next(err);
            } else if (err.code > 0) {
                res.send(err.code, err);
                // err.statusCode = err.code;
                // next(err);
            } else {
                logger.error(err);
                res.send(500, err);
            }
        };

        // **
        const send_result = (res, next) => result => {
            res.send(this.encryptionAdapter.encode(result));
            next();
        };

        // ** Make a dynamic service request
        this.api.get('/:service/:command', (req, res, next) => {
            const service = req.params.service;
            const command = req.params.command;
            const args = this.encryptionAdapter.decode(req.query);

            // ** Make a dynamic service request
            this.request({
                service: service,
                command: command,
                args: args,
                options: {
                    loggingContext: new LoggingContext(req)s
                }
            })
                .then(send_result(res, next))
                .catch(send_error(res, next))
        });

        // ** Make a dynamic service request
        this.api.post('/:service/:command', (req, res, next) => {
            const service = req.params.service;
            const command = req.params.command;
            const args = this.encryptionAdapter.decode(req.body);

            // ** Make a dynamic service request
            this.request({
                service: service,
                command: command,
                args: args,
                options: {
                    loggingContext: new LoggingContext(req)
                }
            })
                .catch(send_error(res, next))
                .then(send_result(res, next));
        });
    }

    start() {
        logger.debug('REST: Starting Http Listener...', {host: this.host, port: this.port});
        this.api.listen(this.port, this.host);

        super.start();
    }

    stop() {
        logger.debug('REST: Stopping Http Listener...');
        this.api.close();

        super.stop();
    }
}

// ** Exports
module.exports = RestExpressInterface;
module.exports.RestExpressInterface = RestExpressInterface;