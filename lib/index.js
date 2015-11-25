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

                    if (!lo.isArray(unmergedValues)){//single object
                        _this.merge(unmergedValues,results);
                        _this.reset();
                        return cb(err,unmergedValues);
                    }

                    //array, so we must assume that the user is to return an array that we can join
                    var len = unmergedValues.length,
                        mergedValues = [];

                    for (var i=0;len > i;i++){
                        _this.merge(unmergedValues[i],results);
                    }

                    _this.reset();
                    return cb(err,unmergedValues);

                });
            }

        ],function(err,results){

            callback(null,results);
        });


    };

    Loader.prototype.merge = function(originalObject,tasks){
        /*
         * Step 1. Loop through the tasks
         * Step 2. Find the reference we need to merge
         * Step 3. Check if the task values is an array or not
         * Step 3a. If an array, loop and search the original
         * Step 3b. If not an array, perform direct replacement
         */

        /*
         * Test for :
         * 1. Array taskValues
         * 2. Single object taskValues
         * 3. Nested inject (MediaFiles.images)
         */

        var _this = this;

        lo.forEach(tasks,function(taskValues,taskName){
            var search = {},
                taskProperties = _this.actionsMap[taskName];
            if (!taskProperties || typeof taskProperties == 'undefined' || typeof taskProperties.inject == 'undefined' || !taskProperties.inject){
                return;
            }
            var objectReference = lo.get(originalObject, taskProperties.inject);

            locate(originalObject,taskValues,objectReference,taskProperties,taskName);

        });
    };

    function locate(originalObject,taskValues,objectReference,taskProperties,taskName){
        var search = {},
            type;


        //check if our taskValues is an Array and perform the search
        if (lo.isArray(taskValues)){
            //could be an array of values or an array of objects
            if (lo.isArray(objectReference)){

                var total = objectReference.length;
                for (var i = 0; total > i;i++){
                    //check if we ar dealing with a value or object. Care for mongoose objects....
                    if (typeof objectReference[i] == 'undefined' ||
                        objectReference[i].hasOwnProperty('_bsontype')){
                        type = 'string';
                        search[taskProperties.onDest] = objectReference[i];
                    } else {//array of objects, we can look for the connecting property
                        if (taskProperties.onSource){
                            type = 'obj';
                            search[taskProperties.onDest] = objectReference[i][taskProperties.onSource];
                        } else {
                            type = 'string';
                            search[taskProperties.onDest] = objectReference[i];
                        }

                        search[taskProperties.onDest] = (taskProperties.onSource) ?
                            objectReference[i][taskProperties.onSource] : objectReference[i];
                    }


                    var found = lo.find(taskValues,search);

                    if (found){
                        objectReference[i] = (type == 'obj') ? lo.merge(objectReference[i],found) : found;
                    }
                }
                return;
            }

            //a single object
            try{
                search[taskProperties.onDest] = (taskProperties.onSource) ? originalObject[taskProperties.inject][taskProperties.onSource] : originalObject[taskProperties.inject];
            }
            catch(e){
                cosnole.log(e)
            }

            var found = lo.find(taskValues,search);

            if (found){
                if (taskProperties.onSource){
                    objectReference = lo.merge(objectReference,found);
                } else {
                    originalObject[taskProperties.as] = found;
                }

            }

            return;
        }

        objectReference = lo.merge(originalObject[taskProperties.as],taskValues);

    }

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
