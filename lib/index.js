module.exports = (function(){
    var async = require('async'),
        lo = require('lodash');


    function Loader(){
        this.withActions = [];
        this.actionsMap = {};
        this.sourceObj = {};
    }

    Loader.prototype.set = function(obj){
        this.sourceObj = obj;
        return this;
    };

    Loader.prototype.with = function(actions){
        if (typeof this.withActions =='undefined'){
            this.withActions = [];
        }

        if (typeof actions == 'string'){
            this.withActions.push(actions);
            return this;
        }

        if (typeof actions == 'object' && typeof actions.length =='undefined'){
            this.withActions.push(actions);
            return this;
        }

        var len = actions.length;
        for (var i = 0;len > i;i++){
            this.withActions.push(actions[i]);

        }

        return this;
    };

    Loader.prototype.exec = function(ret,callback){
        var _this = this;
        async.waterfall([
            ret,
            function(res,cb){

                var asyncObj = {};

                for (var a in _this.withActions){
                    var as = (typeof _this.withActions[a] == 'object') ? _this.withActions[a].as : _this.withActions[a];

                    var join = (typeof _this.withActions[a] == 'object')
                        ? _this.withActions[a].join : _this.withActions[a];

                    _this.actionsMap[as] = _this.withActions[a];
                    if (typeof res.length == 'undefined') {//single object
                        var inject = (typeof _this.withActions[a].inject != 'undefined')
                            ? Object.byString(res, _this.withActions[a].inject) : res;
                    }
                    else {//array of objects
                        var inject = [],
                            len = res.length;

                        for (var i=0;len > i;i++){
                            inject.push(Object.byString(res[i], _this.withActions[a].inject));
                        }
                    }

                    asyncObj[as] = _this.sourceObj[join].bind(null,inject);
                }

                async.parallel(asyncObj,function(err,results){
                    if (typeof res.length == 'undefined'){//single object
                        //proceed to inject any properties with .
                        _this.inject(res,results);
                        _this.reset();
                        return cb(err,lo.merge(res,results));
                    }

                    //array, so we must assume that the user is to return an array that we can join
                    var len = res.length;

                    for (var i=0;len > i;i++){
                        _this.inject(res[i],results);
                    }

                    _this.reset();
                    return cb(err,res);
                });
            }

        ],function(err,results){

            callback(null,results);
        });


    };

    Loader.prototype.inject = function(res,results){
        var _this = this;
        for (var a in results){
            var search = {},
                destObj = Object.byString(res, _this.actionsMap[a].inject);

            if (typeof destObj.length != 'undefined'){ //our result is an array instead of object
                var total = destObj.length;

                for (var x=0;total>x;x++){
                    search[_this.actionsMap[a].onDest] = (destObj[_this.actionsMap[a].onDest] == 'undefined')
                        ? destObj[x] : destObj[_this.actionsMap[a].onDest];
                    destObj[x] = lo.findWhere(results[a],search);
                }
                res[a] = destObj;
                continue;
            }

            if (typeof destObj[_this.actionsMap[a].onSource] == 'undefined'){
                continue;
            }

            search[_this.actionsMap[a].onDest] = destObj[_this.actionsMap[a].onSource];
            var searchMethod = (typeof _this.actionsMap[a] == 'undefined') ? 'where' : 'findWhere';

            res[a] = lo[searchMethod](results[a],search);
        }

        return res;
    };

    Loader.prototype.reset = function(){
        this.withActions = [];
        this.actionsMap = {};

    };
    return Loader;
});

Object.byString = function(o, s) {

    s = s.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
    s = s.replace(/^\./, ''); // strip leading dot
    var a = s.split('.');
    while (a.length) {
        var n = a.shift();
        if (n in o) {
            o = o[n];
        } else {
            return;
        }
    }

    return o;
};