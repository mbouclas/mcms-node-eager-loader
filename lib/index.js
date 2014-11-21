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
                    asyncObj[as] = _this.sourceObj[join].bind(null,res);
                }

                async.parallel(asyncObj,function(err,results){
                    if (typeof res.length == 'undefined'){//single object
                        _this.reset();
                        return cb(err,lo.merge(res,results));
                    }

                    //array, so we must assume that the user is to return an array that we can join
                    var len = res.length;
                    for (var i=0;len > i;i++){
                        for (var a in results){
                            var search = {};
                            search[_this.actionsMap[a].onDest] = res[i][_this.actionsMap[a].onSource];

                            res[i][a] = lo.where(results[a],search);
                        }
                    }

                    _this.reset();
                    return cb(err,res);
                });
            }

        ],function(err,results){

            callback(null,results);
        });


    };

    Loader.prototype.reset = function(){
        this.withActions = [];
        this.actionsMap = {};

    };
    return Loader;
});