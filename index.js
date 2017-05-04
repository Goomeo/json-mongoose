'use strict';

const _                 = require('underscore');
const Promise           = require('bluebird');
const autoIncrement     = require('mongoose-auto-increment');
const joigoose          = require('joigoose');

/**
 * JSON d'entrée pour la génération en modèle mongoose
 *
 * @param {object}              json                            JSON d'entrée
 * @param {object}              json.mongoose                   Instance de mongoose ou autre connexion mongoose
 * @param {object}              json.schema                     schema JOI ou JSON utilisé pour créer le schema mongoose
 * @param {string}              json.collection                 Nom de la collection
 * @param {string|object}       [json.connection]               Mongoose connection created with `mongoose.createConnection()` or juste the string for the new connection
 * @param {function}            [json.schemaUpdate]             Permet de modifier le schéma généré depuis Joi (pour rajouter les unique pae exemple
 * @param {object}              [json.virtual]                  Définition des champs virtuels
 * @param {object}              [json.options]                  Options du schéma Mongoose
 * @param {object}              [json.pre]                      Définition des différent préprocess possibles sur le middleware mongoose
 * @param {object}              [json.post]                     Définition des différent postprocess possibles sur le middleware mongoose
 * @param {object}              [json.methods]                  Méthodes des instances des modèles mongoose
 * @param {object}              [json.statics]                  Méthodes statiques des modèles mongoose
 * @param {object[]|Array[]}    [json.index]                    Tableau des index mongoDB
 * @param {function}            [json.transform]                Méthode de transformation par défaut lors de l'appel de `toObject()`
 * @param {object}              [json.autoinc]                  Autoincrement config for this Model
 * @param {string}              [json.autoinc.field]            Model field with the autoinc column. Default : `_id`
 * @param {number}              [json.autoinc.startAt]          Start value for the autoinc field. Default: 0
 * @param {number}              [json.autoinc.incrementBy]      The increment count for each new element
 */
module.exports = json => {
    if (_.isEmpty(json.schema)) {
        throw new Error('Schema is required');
    }
    if (_.isEmpty(json.collection)) {
        throw new Error('Collection name is required');
    }

    let conn                = json.mongoose.connection;

    if (json.connection) {
        if (_.isString(json.connection)) {
            conn = json.mongoose.createConnection(json.connection);
        } else {
            conn = json.connection;
        }
    }

    if (json.schema.isJoi === true) {
        json.schema = joigoose(json.mongoose).convert(json.schema);

        if (_.isFunction(json.schemaUpdate)) {
            json.schema = json.schemaUpdate(json.schema);
        }
    }

    const schema = new json.mongoose.Schema(json.schema);

    if (json.autoinc) {
        let autoincPlugin = autoIncrement(conn),
            options = _.extend({
                model       : json.collection,
                startAt     : 1,
                incrementBy : 1
            }, json.autoinc);

        schema.plugin(autoincPlugin, options);
    }

    if (_.isFunction(json.transform) && !schema.options.toObject) {
        schema.options.toObject             = {};
        schema.options.toObject.transform   = json.transform;
    }

    _.each(json.pre, (func, key) => {
        schema.pre(key, function pre(next) {
            func(this, next);
        });
    });

    _.each(json.post, (func, key) => {
        schema.post(key, func);
    });

    if (!_.isEmpty(json.methods)) {
        schema.methods = json.methods;
    }
    if (!_.isEmpty(json.statics)) {
        schema.statics = json.statics;
    }

    _.each(json.index, index => {
        if (_.isArray(index)) {
            schema.index(...index);
            return;
        }

        schema.index(index);
    });

    let Model = conn.model(json.collection, schema);

    return Promise.promisifyAll(Model);
};
