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

    Loader.prototype.exec = function(tasksToExecute,callback){
        var _this = this;
        async.waterfall([
            tasksToExecute,
            function(unmergedValues,cb){
                var asyncObj = {};

                for (var a in _this.withActions){
                    var as = (typeof _this.withActions[a] == 'object') ? _this.withActions[a].as : _this.withActions[a];

                    var join = (typeof _this.withActions[a] == 'object')
                        ? _this.withActions[a].join : _this.withActions[a];

                    _this.actionsMap[as] = _this.withActions[a];
                    if (!lo.isArray(unmergedValues)) {//single object
                        var inject = (typeof _this.withActions[a].inject != 'undefined')
                            ? Object.byString(unmergedValues, _this.withActions[a].inject) : unmergedValues;
                    }
                    else {//array of objects
                        var inject = [],
                            len = unmergedValues.length;

                        for (var i=0;len > i;i++){
                            inject.push(Object.byString(unmergedValues[i], _this.withActions[a].inject));
                        }
                    }

                    var extraParams = [_this.sourceObj[join],inject];
                    /*                  extraParams should be something like this, or a single object or a string.
                     [
                     {
                     fields : [
                     'category','permalink'
                     ]
                     },
                     '1234'
                     ]*/
                    if (_this.withActions[a].extraParams){//pass any extra parameters (dynamic params)
                        if (lo.isArray(_this.withActions[a].extraParams)){
                            extraParams = lo.union(extraParams,_this.withActions[a].extraParams);
                        } else {
                            extraParams.push(_this.withActions[a].extraParams);
                        }
                    }

                    asyncObj[as] = async['apply'].apply(null,extraParams);

                }

                async.parallel(asyncObj,function(err,results){
                    if (lo.isObject(unmergedValues)){//single object
                        //proceed to inject any properties with .
                        var mergedValues = _this.inject(unmergedValues,results);
                        _this.reset();
                        return cb(err,lo.merge(unmergedValues,mergedValues));
                        //return cb(err,lo.merge(unmergedValues,results));
                    }

                    //array, so we must assume that the user is to return an array that we can join
                    var len = unmergedValues.length;

                    for (var i=0;len > i;i++){
                        _this.inject(unmergedValues[i],results);
                    }

                    _this.reset();
                    return cb(err,unmergedValues);
                });
            }

        ],function(err,results){

            callback(null,results);
        });


    };

    Loader.prototype.inject = function(originalObject,tasks){
        var _this = this,
            newObject = {};

        lo.forEach(tasks,function(taskValues,taskName){
            var search = {},
                objectToBeReplaced = Object.byString(originalObject, _this.actionsMap[taskName].inject);

            /*            if (typeof objectToBeReplaced[_this.actionsMap[taskName].onSource] == 'undefined'){
             return;
             }*/

            //perform array replacements
            if (lo.isArray(objectToBeReplaced)) { //our result is an array instead of object
                var totalItems = objectToBeReplaced.length;
                newObject[taskName] = [];
                for (var i=0;totalItems > i;i++){
                    search[_this.actionsMap[taskName].onSource] = objectToBeReplaced[i][_this.actionsMap[taskName].onDest];
                    var findValues = lo.find(taskValues,search);
                    if (findValues){
                        newObject[taskName].push(lo.merge(findValues,objectToBeReplaced[i]));
                    } else {
                        newObject[taskName].push(objectToBeReplaced[i]);
                    }
                    /*                    if (taskName == 'ExtraFields'){
                     console.log(taskValues);
                     }*/
                }
            }
            //perform single object replacements
            if (!lo.isArray(objectToBeReplaced)){
                newObject[taskName] = lo.merge(taskValues,objectToBeReplaced);

            }
        });

        return newObject;

        /*  for (var a in tasks){
         var search = {},
         originalValuesToReplace = Object.byString(originalObject, _this.actionsMap[a].inject);

         if (lo.isArray(originalValuesToReplace)){ //our result is an array instead of object
         var total = originalValuesToReplace.length;

         for (var x=0;total>x;x++){
         search[_this.actionsMap[a].onDest] = (originalValuesToReplace[_this.actionsMap[a].onDest] == 'undefined')
         ? originalValuesToReplace[x] : originalValuesToReplace[_this.actionsMap[a].onDest];
         originalValuesToReplace[x] = lo.findWhere(tasks[a],search);
         }
         originalObject[a] = originalValuesToReplace;
         continue;
         }

         if (typeof originalValuesToReplace[_this.actionsMap[a].onSource] == 'undefined'){
         continue;
         }

         search[_this.actionsMap[a].onDest] = originalValuesToReplace[_this.actionsMap[a].onSource];
         var searchMethod = (typeof _this.actionsMap[a] == 'undefined') ? 'where' : 'findWhere';

         originalObject[a] = lo[searchMethod](tasks[a],search);
         }

         return originalObject;*/
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