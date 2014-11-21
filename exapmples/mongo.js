var Loader = require('../lib/index')(),
    eager = new Loader(),
    util = require('util'),
    async = require('async'),
    res = require('./res.json'),
    results = require('./results.json');
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

function test(){

}


test.prototype.showArr = function(callback){
    callback(null,res);
};

test.prototype.getProductThumb = function(ids,callback){
    callback(null,results.thumb);
};

test.prototype.applyDiscount = function(ids,callback){
    callback(null,results.eshop);
};

test.prototype.getProductCategories = function(ids,callback){
    callback(null,results.categories);
};

var T = new test();

eager.set(T).with([relationships.categories,relationships.thumb,relationships.eshop]).exec(T.showArr,function(err,res){
    for (var a in res){

        console.log(JSON.stringify(res[a]));
    }
});