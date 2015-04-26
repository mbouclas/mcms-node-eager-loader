var Loader = require('../lib/index')(),
    eager = new Loader(),
    util = require('util'),
    async = require('async'),
    res = require('./res.json'),
    results = require('./results.json'),
    lo = require('lodash');
var relationships = {
    categories : {
        as : 'categories',
        join : 'getProductCategories',
        onSource : '_id',
        onDest : '_id',
        inject : 'categories'
    },
    ExtraFields : {
        as : 'ExtraFields',
        join : 'getProductExtraFields',
        onSource : '_id',
        onDest : '_id',
        inject : 'ExtraFields'
    },
    eshop : {
        as : 'eshop',
        join : 'applyDiscount',
        onSource : '_id',
        onDest : '_id',
        inject : 'eshop'
    },
    related : {
        as : 'related',
        join : 'getProductRelated',
        onSource : '_id',
        onDest : '_id',
        inject : 'related'
    },
    upselling : {
        as : 'upselling',
        join : 'getProductUpselling',
        onSource : '_id',
        onDest : '_id',
        inject : 'upselling'
    },
    thumb : {
        as : 'thumb',
        join : 'getProductThumb',
        onSource : 'id',
        onDest : 'id',
        inject : 'thumb',
        return : 'single'
    },
    images : {
        as : 'images',
        join : 'getProductImages',
        onSource : '_id',
        onDest : '_id',
        inject : 'mediaFiles.images'
    }
};

var test = {
    mediaFiles : {
        thumb : {
            first : 'one'
        }
    },
    title : 'an obj',
    id : 1
};

locate(test,'mediaFiles.thumb');
console.log(lo.get(test,'id'))

function locate(obj,prop){
    lo.forEach(obj, function (value, key) {

        //console.log(key);
    });
}