var Loader = require('../lib/index')(),
    eager = new Loader(),
    util = require('util'),
    async = require('async');

function test(){

}

var relationships = {
    cars : {
        as : 'cars12',
        join : 'cars'
    },
    carsObj : {
        as : 'cars',
        join : 'carsObj',
        onSource : 'id',
        onDest : 'parentID'
    },
    boatsObj : {
        as : 'boats',
        join : 'boatsObj',
        onSource : 'id',
        onDest : 'parentID'
    }
};

test.prototype.with = function(actions){
    eager.with(actions);
    return this;
};

test.prototype.show = function(callback){
    async.series([function (cb) {
        var ret = {
            id : 1,
            orig : 'orig',
            cars : []
        };
        cb(null,ret);
    }],function(err,result){
        callback(null,result[0]);
    });

};

test.prototype.showArr = function(callback){
    async.series([function (cb) {
        var ret = [
            {
                id : 1,
                orig : 'orig',
                cars : []
            },
            {
                id : 2,
                orig : 'orig',
                cars : []
            }];
        cb(null,ret);
    }],function(err,result){
        callback(null,result[0]);
    });

};

test.prototype.cars = function(obj,callback){
    callback(null,['car 1','car 2','car 3']);
};

/**
 * Simulate the return of an object from somethings like mongo
 * @param obj
 * @param callback
 */
test.prototype.carsObj = function(obj,callback){
    callback(null,[
        {
            parentID : 1,
            title : 'car 1'
        },
        {
            parentID : 1,
            title : 'car 2'
        },
        {
            parentID : 2,
            title : 'car 3'
        }
    ]);
};

/**
 * Simulate the return of an object from somethings like mongo
 * @param obj
 * @param callback
 */
test.prototype.boatsObj = function(obj,callback){
    callback(null,[
        {
            parentID : 1,
            title : 'boat 1'
        },
        {
            parentID : 2,
            title : 'boat 2'
        },
        {
            parentID : 2,
            title : 'boat 3'
        }
    ]);
};

test.prototype.boats = function(obj,callback){
    console.log('boats ' + obj.orig);
    callback(null,['boat 1','boat 2','boat 3']);
};

var T = new test();
//simple example. Just merges results
/*eager.set(T).with(relationships.cars).with('boats').exec(T.show,function(err,res){
    console.log('res: ',res);
});*/

//Eager loading exapmle
eager.set(T).with([relationships.carsObj,relationships.boatsObj]).exec(T.showArr,function(err,res){
    for (var a in res){

        console.log('res: ',res[a]);
    }
});
/*T.with('cars').with('boats').show(function(err,res){
    console.log(res);
});*/
