# json-mongoose
Mongoose model representation like waterline models

# Installation

```
npm install json-mongoose
```

This package is compatible with : Node.js >= 4.x (node.JS 4, 5 and 6 for now)

# Usage

This library was created to simplify and organize code in mongose model declaration and it add some new features :

+ Create model from Joi schema to use it for validation
+ Promisify mongoose functions

## Declaration example

Schema :

```javascript
'use strict';

const Joi = require('joi');

module.exports = Joi.object({
    firstName       : Joi.string().required(),
    lastName        : Joi.string().required(),
    age             : Joi.number().integer(),
    emailAddress    : Joi.string().email().required(),
    login           : Joi.string().required(),
    password        : Joi.string().required()
});
```

Model :

```javascript
'use strict';

const jsonToMongoose    = require('json-mongoose');
const async             = require('async');
const bcrypt            = require('bcrypt');
const mongoose          = require('mongoose');

module.exports = jsonToMongoose({
    mongoose    : mongoose,
    collection  : 'user',
    schema      : require('../schemas/user'),
    autoinc     : {
        field : '_id'
    },
    pre         : {
        save : (doc, next) => {
            async.parallel({
                password : done => {
                    bcrypt.hash(doc.password, 10, (err, hash) => {
                        if (err) {
                            return next(err);
                        }
                        doc.password = hash;
                        done();
                    });
                }
            }, next);
        }
    },
    schemaUpdate : (schema) => {
        schema.login.unique         = true;
        schema.emailAddress.unique  = true;

        return schema;
    },
    transform : (doc, ret, options) => {
        delete ret.password;

        return ret;
    },
    options : {

    }
});
```

# Parameters

The function get only one parameter with may options :


| Option | Type | Required | Description |
| ----  | ---- | ----       | ---- |
| mongoose | Object | **true** | Mongoose instance |
| schema | Object | **true** | Joi schema or JSON schema. If you use JOI schema, you should be used the `schemaUpdate` Method to set the unique fields or other params |
| collection | string | **true** | Collection name |
| connection | String or Object | false | Mongoose connection created with `mongoose.createConnection()` or juste the string for the new connection |
| schemaUpdate | function | false | This function is used if your schema is a JOI schema. In this case, you can set specifics fields unique, ... |
| virtual | object | false |define model virtual fields |
| options | object | false | Mongoose schema options |
| pre | object | false | Define different preprocess functions in the middleware for your model |
| post | object | false | Define different preprocess functions in the middleware for your model |
| methods | object | false | Define all instance functions for your model |
| statics | object | false | Define all statics functions for your model |
| index | object[]/Array[] | false | Define model indexes. Use an array to pass index options. |
| transform | function | false | Define the default transform method for your model |
| autoinc | Object | false | Autoincrement config for this Model |
| autoinc.field | String | false | Field with the autoinc |
| autoinc.startAt | Number | false | Start value for the auto inc. Default : 0 |
| autoinc.incrementBy | Number | false | Auto Inc steps. Default : 1 |
