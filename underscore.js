//     Underscore.js 1.8.2
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
//自执行函数，上下文是this
(function () {

    // Baseline setup
    // --------------

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;

    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // Create quick reference variables for speed access to core prototypes.
    var
        push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
        nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        nativeCreate = Object.create;

    // Naked function reference for surrogate-prototype-swapping.
    //surrogate：n.代理，代表;代用品，代替，代孕者，[心]代用人物;〈美〉遗嘱检验法庭[法官];adj.代理的;代理的;v.代理，替代;
    //空函数，用于原型转换
    var Ctor = function () {
    };

    // Create a safe reference to the Underscore object for use below.
    /***
     * 1,创建函数_
     * 2,函数有一个参数obj
     * 3,_作为函数使用，如果obj已经是_的实例，则直接返回该obj
     * 4,_作为方法使用，并且其调用的上下文对象不是_的实例，递归调用_，以该参数obj作为参数，返回一个_实例
     * 5,_作为构造函数使用，则对其参数obj添加一个_wrapped属性，该属性值就是该参数obj
     * @param obj
     * @returns {*}
     * @private
     */
    var _ = function (obj) {
        //_作为普通函数执行的时候: 如果obj是_的实例(意思就是,obj对象是通过 new _()生成的),则直接返回该obj: eg: _({})
        if (obj instanceof _) return obj;
        //如果_函数的执行上下文不是_的实例, 则返回一个var ins = new _(obj)实例, 这是一个递归调用:
        // 1,因为obj不是_的实例,所以,new _(obj)不会执行_函数体中的第一句代码
        // 2,因为var ins = new _(obj)执行的时候,_构造函数内的this指向的是当前构建的对象ins, 而ins又刚刚好是_的实例,所以,该函数内的第二句话也不会执行
        // 3,所以,最后,new _(obj)执行的是该函数体内的第三句话,即给this对象绑定一个_wrapped属性,该属性指向obj
        // 其实是给ins对象添加了一个_wrapped属性
        // eg: _.call({}, []), 其中{}是指向上下文this, []是obj参数, 返回值是new _([])
        if (!(this instanceof _)) return new _(obj);
        //执行上下文的_wrapped属性指向obj: eg:  var o = new _({})的时候,对象o的_wrapped属性指向obj对象{}
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    //如果exports作为一个全局变量存在，则说明支持模块化加载，否则，就直接把_作为全局对象root的一个属性暴露出去
    if (typeof exports !== 'undefined') {
        //如果module和module.exports都存在，则说明该环境是标准的commonjs环境，则把_作为模块接口暴露出去
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    // Current version.
    _.VERSION = '1.8.2';

    // Internal function that returns an efficient (for current engines) version
    // of the passed-in callback, to be repeatedly applied in other Underscore
    // functions.
    //optimize:vt.使最优化，使尽可能有效;
    //表达式void 0的目的是生成一个标准的undefined值，避免直接使用undeinfed之是担心有人重定义了全局变量undefined
    //参考资料：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/void

    /****
     * 该函数功能：生成一个函数，该函数绑定了上下文context，并且仅能使用argCount个参数
     * @param func
     * @param context
     * @param argCount
     * @returns {*}
     */
    var optimizeCb = function (func, context, argCount) {
        //如果没有传上下文参数，或者上下文参数是undefined，则直接返回func参数（记住：函数参数未传，则默认值是undefined！）
        //void 0 === undefined 返回 true
        //因为只有1个参数，所以，直接返回该func了，不做任何优化：void是一个操作符，执行之后不会返回值（不会返回值其实就是返回undefined）
        if (context === void 0) return func;
        //argCount：参数个数
        //如果argCount参数显式的传入了null或者不传(不传即是undefined，而undefined==null是返回true)，则直接执行分支语句3
        switch (argCount == null ? 3 : argCount) {
            //argCount==1:指定func函数的上下文为context，并且该func函数只能有1个参数被使用。
            case 1:
                return function (value) {
                    return func.call(context, value);
                };
            //argCount==2,跟argCount==1的情况一样，只是该func函数只能有2个参数被使用。
            case 2:
                return function (value, other) {
                    return func.call(context, value, other);
                };
            //argCount==3,跟argCount==1的情况一样，只是该func函数只能有3个参数被使用。
            case 3:
                return function (value, index, collection) {
                    return func.call(context, value, index, collection);
                };
            //argCount==4,跟argCount==1的情况一样，只是该func函数只能有4个参数被使用。
            case 4:
                return function (accumulator, value, index, collection) {
                    return func.call(context, accumulator, value, index, collection);
                };
        }

        //如果argCount不等于1,2,3,4,null中任何一个值的话，就返回一个全参数的函数，
        // 上下文context，外层函数的参数arguments全部传入作为其参数，context作为该函数的上下文
        //注意，这里使用了apply方法，而不是上面的call方法了
        return function () {
            return func.apply(context, arguments);
        };
    };

    // A mostly-internal function to generate callbacks that can be applied
    // to each element in a collection, returning the desired result — either
    // identity, an arbitrary callback, a property matcher, or a property accessor.
    //cb函数强依赖optimizeCb函数
    var cb = function (value, context, argCount) {
        //如果没有传入value参数，则直接返回_.identity函数
        if (value == null) return _.identity;
        //如果value是函数，则返回optimizeCb函数：指定了value函数的上下文context，以及argCount
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        //如果value是对象，则返回_.matcher(value)
        if (_.isObject(value)) return _.matcher(value);

        //如果不是null,不是函数，不是对象(函数是对象)，
        //那么，返回一个属性访问器：这个属性访问器函数从传入的obj参数中获取以value为key的value
        return _.property(value);
    };

    //iteratee函数其实就是调用cb函数：关键看value是个什么值了！
    //这里的目的是将cb函数通过变量_暴露出去
    _.iteratee = function (value, context) {
        return cb(value, context, Infinity);
    };

    // An internal function for creating assigner functions.
    //该函数实现了对象属性的拷贝功能！
    //crateAssigner执行后，创建一个函数F，函数F的第一个参数为obj对象
    //如果函数F的参数大于或等于2个，则从第二个及后续的参数对象B开始，执行B对象属性到obj对象属性的覆盖动作
    //满足如下2个条件之一即可成功执行覆盖动作：1，undefinedOnly参数值为假，则不管obj中该属性是否已定义，全部覆盖！2，若undefinedOnly为真，则只能覆盖obj中未定义的属性（注意：不包含null）！
    //_.extendOwn = _.assign = createAssigner(_.keys);
    //_.extend = createAssigner(_.allKeys);
    //_.defaults = createAssigner(_.allKeys, true);

    //该函数返回了一个使用了keysFunc参数和undefinedOnly参数的函数F
    //keysFunc：筛选函数，根据传入的对象参数，生成keys的函数，即通过该函数可以指定哪些key可以覆盖目标对象的key
    //undefinedOnly：是否仅覆盖值为undefined的key。如果为false，则不管目标对象obj的属性为什么，都覆盖，否则，只覆盖obj中未定义的属性（注意：不包含null）
    //函数F的功能：
    var createAssigner = function (keysFunc, undefinedOnly) {
        return function (obj) {
            var length = arguments.length;
            //如果只有一个参数或者参数第一个参数为null，则直接返回第一个参数
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) {
                var source = arguments[index],
                    keys = keysFunc(source), //该keysFunc将根据source来决定哪些key是可以被拷贝到目标对象上去
                    l = keys.length;
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
                }
            }
            //返回扩展后的obj对象！
            return obj;
        };
    };

    // An internal function for creating a new object that inherits from another.
    //创建一个对象继承对象的基本函数，其实是一个兼容版的Object.create函数
    var baseCreate = function (prototype) {
        //如果prototype不是对象，则直接返回一个空对象
        if (!_.isObject(prototype)) return {};
        //如果浏览器支持Object.create函数，则直接调用内置的Object.create函数来创建对象，该对象继承自prototype参数
        if (nativeCreate) return nativeCreate(prototype);

        //如果不支持Object.create，以下继承方式出现在ExtJs当中！
        //把一个空函数的原型指向prototype对象
        Ctor.prototype = prototype;
        //创建出一个空对象，该对象的原型就是prototype对象
        var result = new Ctor;
        //恢复空函数的prototype属性为null
        Ctor.prototype = null;

        //对于对象result，即使其构造函数的prototype属性已经被重置为null了，但该对象依然可以访问到构造函数之前的prototype中的值
        //重要结论：某一个对象的原型链在构造该对象的时候就已经创建好了，不再受对象构造函数的改变而改变了！！！
        /****
         * //例子
         * function Ctor(){}; Ctor.prototype = {a:'aaa'}; var c = Ctor(); console.log(c.a) //输出'aaa'
         * Ctor.prototype = null; console.log(c.a) //仍然输出'aaa'
         * Ctor.prototype = {b:'bbb'}; console.log(c.b) //输出二undefined，因为c对象的原型链在创建该对象的时候，就已经创建好了！
         */

        return result;
    };

    // Helper for collection methods to determine whether a collection
    // should be iterated as an array or as an object
    // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    //具有length属性且其值是number类型，且值>=0的，都属于类数组！比如：arguments, string，document.getElementsByTagName()之类的
    //当然，长度length得有个上限:MAX_ARRAY_INDEX
    //_.isArrayLike包含了_.isArray
    //有length属性，且length类型是number的，就都认为是arrayLike对象了
    var isArrayLike = function (collection) {
        var length = collection && collection.length;
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };


    //集合操作的函数
    // Collection Functions
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles raw objects in addition to array-likes. Treats all
    // sparse array-likes as if they were dense.
    _.each = _.forEach = function (obj, iteratee, context) {
        /***
         *
         var optimizeCb = function(func, context, argCount) {
        return function(value, index, collection) {
          return func.call(context, value, index, collection);
        } 
      }
         * */
        //这里optimizeCb(iteratee, context)改变了iteratee的执行上下文为context
        //iteratee就是函数optimizeCb中的func参数，最后func参数是要在context上下文中执行的
        /**
         所以，这里iteratee其实已经变成了
         iteratee = function(value, index, collection) {
        return func.call(context, value, index, collection);
      }
         最后的func，就是最初的参数iteratee
         **/
        //绑定了itertee函数的执行上下文，且该iteratee的参数是任意多：请参考optimizeCb函数的实现
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        //类数组的遍历方式：注意参数的传入顺序: value, index, obj
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        }
        //对象的遍历方式：注意参数的传入顺序: value, key, obj
        else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };

    // Return the results of applying the iteratee to each element.
    _.map = _.collect = function (obj, iteratee, context) {
        //这里调用cb(iteratee, context)跟调用optimizeCb(iteratee, context)的结果完全是一回事，搞不懂为什么要搞这么麻烦！
        // 搞懂了，这里是为了统一编码风格，这种调用方式到处都有！
        //cb这里还多了一层函数嵌套！
        iteratee = cb(iteratee, context);
        //下面2行代码用了简写的逻辑判断：
        //如果obj是类数组，那么keys=false,那么length=obj.length;
        //如果obj不是类数组，那么keys=_.keys(obj)，那么，length=keys.length;
        //加上后面使用了keys来做currentKey的判断，不得不说代码写的非常巧妙，可以少写一个变量！
        /**
         //这样写可读性会好一点点，代码量也不算多。
         var keys, length, isArray = isArrayLike(obj);
         length = ( isArray ? obj.length : (keys = _.keys(obj)).length )
         后续的currentKey直接用isArray来做判断。
         **/

        /***
         * 另外一种理解方式：
         * 拿keys，拿length，以及遍历的时候，拿value
         * 事情简单了：第一行代码拿keys，第二行代码拿length，第三行代码（for循环中的第一行代码）就是拿value了
         */

        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length,
            results = Array(length);
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    // Create a reducing function iterating left or right.
    //根据函数体可知，dir只能为+1或者-1，+1代表从左向右，-1代表从右向左遍历
    //这里之所以这么做，主要是因为createReduce函数是一个内部函数，并没有对外提供接口，所以没有对dir参数做限制
    function createReduce(dir) {
        // Optimized iterator function as using arguments.length
        // in the main function will deoptimize the, see #1991.
        function iterator(obj, iteratee, memo, keys, index, length) {
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                //这里也要关注一下iteratee的参数：iteratee(memo, obj[currentKey], currentKey, obj);
                //memo：上一次的值；obj[currentKey]：当前遍历出的值；currentKey：当前遍历的key；遍历的obj对象
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            return memo;
        }

        /****
         * obj:遍历的对象
         * itertee:遍历用的函数
         * memo:上一次iteratee执行的结果
         * context：iteratee执行的上下文
         */
        return function (obj, iteratee, memo, context) {
            /**
             传入argCount=4的时候，optimizeCb函数如下：
             var optimizeCb = function(func, context, argCount){
                return function(accumulator, value, index, collection) {
                  return func.call(context, accumulator, value, index, collection);
                }
              }
             **/
            iteratee = optimizeCb(iteratee, context, 4);
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                //起始index，其实就是向左还是向右遍历
                index = dir > 0 ? 0 : length - 1;
            // Determine the initial value if none is provided.
            if (arguments.length < 3) {
                memo = obj[keys ? keys[index] : index];
                index += dir;
            }
            return iterator(obj, iteratee, memo, keys, index, length);
        };
    }

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`.
    //aka:abbr.又叫做，亦称(also known as的缩写);
    _.reduce = _.foldl = _.inject = createReduce(1);

    // The right-associative version of reduce, also known as `foldr`.
    _.reduceRight = _.foldr = createReduce(-1);

    // Return the first value which passes a truth test. Aliased as `detect`.
    //返回值是找到第一个满足predicate函数的value！not key
    _.find = _.detect = function (obj, predicate, context) {
        var key;
        //根据是否是类数组，而进行不同的查找
        if (isArrayLike(obj)) {
            //这个找序号
            key = _.findIndex(obj, predicate, context);
        } else {
            //这个找key
            key = _.findKey(obj, predicate, context);
        }
        //如果key不为undefined并且key不为 -1, 则返回obj[key]，否则，函数默认返回undefined
        if (key !== void 0 && key !== -1) return obj[key];
    };

    // Return all the elements that pass a truth test.
    // Aliased as `select`.
    _.filter = _.select = function (obj, predicate, context) {
        var results = [];
        //改变predicate函数的执行上下文为context
        predicate = cb(predicate, context);
        _.each(obj, function (value, index, list) {
            //从obj中收集所有predicate函数返回值为true的value
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };

    // Return all the elements for which a truth test fails.
    _.reject = function (obj, predicate, context) {
        /**
         _.negate = function(predicate) {
          return function() {
            return !predicate.apply(this, arguments);
          };
        };
         **/
        //执行顺序：
        /**
         predicate = cb(predicate);//cb(predicate);其实就是optimizeCb(predicate),其实就是predicate。所以，搞不懂这里为什么要这样用？！直接传predicate到_.negate函数不行吗？！
         predicate = _.negate(predicate);//这一步，得到的predicate=function(){!predicate.apply(this, arguments);}
         _.filter(obj, predicate, context);//这一步会把predicate的上下文改成context执行，所以，上面的predicate函数里面的this就是指context
         **/
        return _.filter(obj, _.negate(cb(predicate)), context);
    };

    // Determine whether all of the elements match a truth test.
    // Aliased as `all`.
    //只要有一个predicate函数执行之后返回false，函数_.every就会返回false，否则返回true
    _.every = _.all = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj)) return false;
        }
        return true;
    };

    // Determine if at least one element in the object matches a truth test.
    // Aliased as `any`.
    //只要有一个predicate函数执行之后返回true，_.some函数就会返回true，否则返回false
    _.some = _.any = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (predicate(obj[currentKey], currentKey, obj)) return true;
        }
        return false;
    };

    // Determine if the array or object contains a given value (using `===`).
    // Aliased as `includes` and `include`.
    //
    _.contains = _.includes = _.include = function (obj, target, fromIndex) {
        //如果obj不是数组，则直接取obj的所有的value值组成一个数组，并重新赋值给obj
        if (!isArrayLike(obj)) obj = _.values(obj);
        //如果indexOf等于-1,则返回false，否则返回true
        return _.indexOf(obj, target, typeof fromIndex == 'number' && fromIndex) >= 0;
    };

    // Invoke a method (with arguments) on every item in a collection.
    //如果method是函数，则以obj里面的每一个属性值作为method的上下文执行该函数
    //如果method只是一个函数名，则对obj里面的每一个属性值value，查看其是否有一个method属性，
    //并且该属性值是否是一个函数，如果是函数，则以该value为上下文，执行函数method
    _.invoke = function (obj, method) {
        //取第3个及之后的参数生成一个参数列表
        var args = slice.call(arguments, 2);
        var isFunc = _.isFunction(method);
        return _.map(obj, function (value) {
            //如果method是function类型，则给func赋值method，否则，从obj中的value里面取method属性值
            var func = isFunc ? method : value[method];
            return func == null ? func : func.apply(value, args);
        });
    };

    // Convenience version of a common use case of `map`: fetching a property.
    //pluck:n.勇气，精神;内脏;快而猛的拉;〈俚〉不及格;vt.拔掉;采，摘;鼓起（勇气等）;弹（乐器）;vi.拉，拽;
    //obj是一个复杂对象，即key下面的value值也是一个对象o
    //var obj = {a:{name:"yisx"}, b:{name:"yanss"}}; _.pluck(obj, "name"); //返回值是["yisx", "yanss"]
    _.pluck = function (obj, key) {
        return _.map(obj, _.property(key));
    };

    // Convenience version of a common use case of `filter`: selecting only objects
    // containing specific `key:value` pairs.
    //obj是一个复杂对象，即key下面的value值也是一个对象o
    //对象o含有attrs键值对，其key值才会把放到返回值里面
    _.where = function (obj, attrs) {
        return _.filter(obj, _.matcher(attrs));
    };

    // Convenience version of a common use case of `find`: getting the first object
    // containing specific `key:value` pairs.
    //obj是一个复杂对象，参考_.where
    _.findWhere = function (obj, attrs) {
        return _.find(obj, _.matcher(attrs));
    };

    // Return the maximum element (or element-based computation).
    //返回obj中的最大值，或者返回基于obj中的元素，通过iterate函数计算出来的最大值
    _.max = function (obj, iteratee, context) {
        var result = -Infinity, lastComputed = -Infinity,
            value, computed;
        //如果没有传入比较函数iterate，则直接比较obj中的值
        if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value > result) {
                    result = value;
                }
            }
        } else {
            //如果传入了iterate函数，则先把obj中的value传入到iterate函数中，计算出结果computed，选出computed最大值对应的value值
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list);
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Return the minimum element (or element-based computation).
    //参考_.max
    _.min = function (obj, iteratee, context) {
        var result = Infinity, lastComputed = Infinity,
            value, computed;
        if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value < result) {
                    result = value;
                }
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list);
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Shuffle a collection, using the modern version of the
    // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
    //shuffle：洗牌
    _.shuffle = function (obj) {
        //拿到值的集合
        var set = isArrayLike(obj) ? obj : _.values(obj);
        var length = set.length;
        var shuffled = Array(length);
        for (var index = 0, rand; index < length; index++) {
            rand = _.random(0, index);
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
        }
        return shuffled;
    };

    // Sample **n** random values from a collection.
    // If **n** is not specified, returns a single random element.
    // The internal `guard` argument allows it to work with `map`.
    //从obj里面去样本数据,如果obj不是数组,则从obj中任意取一个值
    //如果obj是数组,则先将obj打乱,然后再取出前n个元素取出来
    _.sample = function (obj, n, guard) {
        if (n == null || guard) {
            if (!isArrayLike(obj)) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
        }
        return _.shuffle(obj).slice(0, Math.max(0, n));
    };

    // Sort the object's values by a criterion produced by an iteratee.
    //criterion: n.规范; （批评、判断等的）标准，准则; 
    //1，先对obj执行map操作，其返回值是一个数组arr，数组内的元素是一个object类型元素
    //2，对数组arr执行一个原生的sort排序操作
    //   函数sort操作参考资料：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    //3，以上2步操作完成之后，会生成一个排好序的arr数组，继续对该arr数组调用_.pluck(arr, 'value')，该操作会返回一个数组results，其元素是数组arr中的value键的值
    _.sortBy = function (obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        return _.pluck(_.map(obj, function (value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iteratee(value, index, list)//这里计算出传入函数iteratee的值，该值在后面的排序中会用到！
            };
        }).sort(function (left, right) {//left是排序数组arr遍历的当前元素，right是当前参数的下一个参数。遍历总次数(arr.length - 1)次
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                //如果a>b，或者a的值为undefined，则返回1，返回1的意思是，right将要排到left的前面，这和原生函数sort排序规则一致：前面的大于后面的，则后面的排前面
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            //这里left.index的值一定小于right.index的值，其值始终等于-1
            return left.index - right.index;
        }), 'value');
    };

    // An internal function used for aggregate "group by" operations.
    //aggregate:n.骨料; 合计; 聚集体; 集料（可成混凝土或修路等用的）; adj.总数的，总计的; 聚合的; [地]聚成岩的;vt.使聚集，使积聚; 总计达;
    var group = function (behavior) {
        //behavior函数用于生成result
        //iteratee函数用于对obj做预处理，并返回key值：
        //在_.groupBy函数中返回组名;在_.indexBy中返回index值;在_.countBy中返回计数的key值
        return function (obj, iteratee, context) {
            var result = {};
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index) {
                var key = iteratee(value, index, obj);
                behavior(result, value, key);
            });
            return result;
        };
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = group(function (result, value, key) {
        if (_.has(result, key)) result[key].push(value); else result[key] = [value];
    });

    // Indexes the object's values by a criterion, similar to `groupBy`, but for
    // when you know that your index values will be unique.
    _.indexBy = group(function (result, value, key) {
        result[key] = value;
    });

    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    _.countBy = group(function (result, value, key) {
        if (_.has(result, key)) result[key]++; else result[key] = 1;
    });

    // Safely create a real, live array from anything iterable.
    //4种情况
    _.toArray = function (obj) {
        //值为假的对象null, undefined, ''
        if (!obj) return [];
        //数组对象
        if (_.isArray(obj)) return slice.call(obj);
        //类数组对象：arguments, string, document.getElementsByTagName()之类的
        if (isArrayLike(obj)) return _.map(obj, _.identity);
        //对象：返回对象的value组成的数组
        return _.values(obj);
    };

    // Return the number of elements in an object.
    //3种类型：null, array, object
    _.size = function (obj) {
        if (obj == null) return 0;
        return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };

    // Split a collection into two arrays: one whose elements all satisfy the given
    // predicate, and one whose elements all do not satisfy the predicate.
    _.partition = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var pass = [], fail = [];
        _.each(obj, function (value, key, obj) {
            //这段代码真tm简洁！
            (predicate(value, key, obj) ? pass : fail).push(value);
        });
        return [pass, fail];
    };


    //数组函数
    // Array Functions
    // ---------------

    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    //奇怪的是,这个guard参数用来干嘛呢???
    _.first = _.head = _.take = function (array, n, guard) {
        //如果array为null或者undefined,则直接返回undefined
        if (array == null) return void 0;
        //如果n == null成立,或者guard为真, 则返回数组第一个元素
        if (n == null || guard) return array[0];

        return _.initial(array, array.length - n);
    };

    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N.
    //函数功能上面的英文说明已经非常非常清楚了！
    //对array进行slice截取操作，截取范围从0开始，到(array.length - x)结束，其中x可能有以下几种情况：
    //1,没有传入n或者n为假值，则x=1;
    //2,传入了n>0，但是guard参数为真，则x=1;
    //3,传入了n>0,并且guard也为假，则x=n;
    //从array中取前面几个元素
    _.initial = function (array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };

    // Get the last element of an array. Passing **n** will return the last N
    // values in the array.

    _.last = function (array, n, guard) {
        if (array == null) return void 0;
        if (n == null || guard) return array[array.length - 1];
        return _.rest(array, Math.max(0, array.length - n));
    };

    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array.
    //如果n为假,即null或者undefined, 或者guard传入,则取array第1个到最后一个元素
    //否则,取array中从n及之后的元素
    //这个guard是slice函数原生自带的参数
    _.rest = _.tail = _.drop = function (array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };

    // Trim out all falsy values from an array.
    //去掉数组中的假值,即从array中过滤出_.identity函数返回值为真的值
    _.compact = function (array) {
        return _.filter(array, _.identity);
    };

    // Internal implementation of a recursive `flatten` function.
    //如果shallow为false,strict为true的话，这个函数就没得玩了，直接返回空！！！
    var flatten = function (input, shallow, strict, startIndex) {
        var output = [], idx = 0;
        for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
            var value = input[i];
            if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                //flatten current level of array or arguments object
                if (!shallow) value = flatten(value, shallow, strict);
                var j = 0, len = value.length;
                output.length += len;
                while (j < len) {
                    output[idx++] = value[j++];
                }
            }
            //这个strict参数的目的就是：如果value不是类数组、数组或者arguments对象，则不把该value计入output当中去
            //strict=true，只展开复杂对象并将结果放到输出中
            //strict=false，也输出基本类型值
            else if (!strict) {
                output[idx++] = value;
            }
        }
        return output;
    };

    // Flatten out an array, either recursively (by default), or just one level.
    _.flatten = function (array, shallow) {
        return flatten(array, shallow, false);
    };

    // Return a version of the array that does not contain the specified value(s).
    //从array中排除第二个及之后的参数
    _.without = function (array) {
        return _.difference(array, slice.call(arguments, 1));
    };

    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function (array, isSorted, iteratee, context) {
        if (array == null) return [];
        //如果isSorted参数没有传，则把isSorted参数剔除掉！
        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }
        if (iteratee != null) iteratee = cb(iteratee, context);
        var result = [];
        var seen = [];
        for (var i = 0, length = array.length; i < length; i++) {
            var value = array[i],
            //这里把value经过iteratee加工一下，生成value所对应的新的数据computed
                computed = iteratee ? iteratee(value, i, array) : value;
            //这里要分3条分支来分析数据了
            //1，array是排好序的，那么，每一次用seen记住上一次的值，那么，下一次的值只要不跟上一次相同，都可以把value值push进result里面去
            if (isSorted) {
                if (!i || seen !== computed) result.push(value);
                seen = computed;
            }
            //2，iteratee处理函数存在：如果seen里面没有这个计算结果，则把计算结果放进seen，而把真正的value放进result，毕竟我们要的结果是array里面的数据
            else if (iteratee) {
                //这里的_.contains判断效率会有点低，很有可能每一次进行contains判断，都会遍历一次result数组。有一个更优化的去重方案是用字典对象来做记录操作。
                if (!_.contains(seen, computed)) {
                    seen.push(computed);
                    result.push(value);
                }
            }
            //3，这一个分支执行的时候，是前面2个分支都不成里的情况下才会执行：no isSorted, no iteratee
            //直接针对result进行判断就行了！有就不要push了，没有就push进来
            //这里的_.contains判断效率会有点低，很有可能每一次进行contains判断，都会遍历一次result数组。有一个更优化的去重方案是用字典对象来做记录操作。
            else if (!_.contains(result, value)) {
                result.push(value);
            }
        }
        return result;
    };

    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    //union:n.同盟，联盟; 协会，工会; 联合，团结; adj.工会的;
    //只会返回参数中的复杂对象，比如数组，类数组，arguments之类的对象展开之后的值，而不会返回参数中的基本类型值
    _.union = function () {
        return _.uniq(flatten(arguments, true, true));
    };

    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    //intersection:n.横断，横切; 交叉，相交; 交叉点，交叉线; [数]交集; 
    _.intersection = function (array) {
        if (array == null) return [];
        var result = [];
        var argsLength = arguments.length;
        for (var i = 0, length = array.length; i < length; i++) {
            var item = array[i];
            //如果result中已经有了，那么直接跳过，保证result中的数据不重复
            if (_.contains(result, item)) continue;
            //遍历参数
            for (var j = 1; j < argsLength; j++) {
                //如果某一个参数是个数组，且数组中包含了这个item，那么，当前for循环马上终止，否则继续for循环，继续判断，知道循环完毕，此时j=argsLength
                if (!_.contains(arguments[j], item)) break;
            }
            //只有当j===argsLength的时候，才能够把item放进数组中。什么时候j才会等于argsLength？每一个参数（数组）里都有item值
            if (j === argsLength) result.push(item);
        }
        return result;
    };

    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    //函数功能，从array参数中取出与后续所有参数不相同的元素。
    _.difference = function (array) {
        //首先把第2个及以后的参数展开生成一个数组rest。
        var rest = flatten(arguments, true, true, 1);
        //过滤数组array，把所有包含在rest中的元素过滤掉，然后返回过滤后的数组
        return _.filter(array, function (value) {
            return !_.contains(rest, value);
        });
    };

    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function () {
        return _.unzip(arguments);
    };

    // Complement of _.zip. Unzip accepts an array of arrays and groups
    // each array's elements on shared indices
    _.unzip = function (array) {
        //这里传入的length字符串，起始在_.max中通过cb('length')生成了一个属性（length）访问器函数。
        // _.max函数访问array中每一个元素的长度，返回长度最长的那个
        // 然后再计算出array中的最长的元素的长度，赋值给length
        var length = array && _.max(array, 'length').length || 0;
        var result = Array(length);

        for (var index = 0; index < length; index++) {

            result[index] = _.pluck(array, index);
        }
        return result;
    };

    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    //把一组这样的数据转变成一个字典：[["key1","value1"], ["key2", "value2"],...]
    //或者这样2组数据转化成一个字典：["key1", "key2", ...] ["value1", "value2", ...]
    _.object = function (list, values) {
        var result = {};
        for (var i = 0, length = list && list.length; i < length; i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };

    // Return the position of the first occurrence of an item in an array,
    // or -1 if the item is not included in the array.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    //
    _.indexOf = function (array, item, isSorted) {
        var i = 0, length = array && array.length;
        //isSorted是数字类型的时候
        if (typeof isSorted == 'number') {
            //如果isSorted<0，则从0和length+isSorted中取最大值，并赋值给i，否则赋值i=isSorted
            //这里length+isSorted其实是数组的一个位置，最后一个位置是-1,这里通过length加一个负数来转变成一个正的序号，负数绝对值大于length，则直接取0
            i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
        } else if (isSorted && length) {//isSorted不是数字，但等效真值，且length>0的时候
            i = _.sortedIndex(array, item);//调用二分查找法，提升查找效率！
            return array[i] === item ? i : -1;
        }
        //自己不等于自己的值，只有NaN这一个值！
        if (item !== item) {
            return _.findIndex(slice.call(array, i), _.isNaN);
        }
        for (; i < length; i++) if (array[i] === item) return i;
        return -1;
    };

    _.lastIndexOf = function (array, item, from) {
        var idx = array ? array.length : 0;
        //如果from类型是number
        if (typeof from == 'number') {
            //如果from小于0，则idx+from是把一个负数的下标转成正数下表
            //这里之所以要+1，是因为后续的操作，比如slice.call(array, 0, idx)是不会把idx算进来
            //而while(--idx>=0)的操作也是先让idx自减之后再做比较的
            idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
        }
        //NaN是JS中唯一不等于自己的值，因此可以用来判断一个变量是否真的为NaN：a!==a
        //参考资料：http://www.cnblogs.com/dson/p/4415278.html
        if (item !== item) {
            return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
        }
        //下面的--idx是先计算出idx的值，然后再做比较运算
        while (--idx >= 0) if (array[idx] === item) return idx;
        return -1;
    };

    // Generator function to create the findIndex and findLastIndex functions
    //这里dir是direction的意思，
    // 其值只能是1或者-1,1代表从前往后找，-1代表从后往前找
    function createIndexFinder(dir) {
        return function (array, predicate, context) {
            //这里之所以没有对predicate是否传入做判断，是因为cb函数内部已经做了判断了！如果predicate==null，则其值为_.identity
            predicate = cb(predicate, context);
            var length = array != null && array.length;
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
                if (predicate(array[index], index, array)) return index;
            }
            return -1;
        };
    }

    // Returns the first index on an array-like that passes a predicate test
    _.findIndex = createIndexFinder(1);

    _.findLastIndex = createIndexFinder(-1);

    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function (array, obj, iteratee, context) {
        //如果iteratee没有传入，则if (value == null) return _.identity;
        //iteratee = _.identity, 而_.identity = function(value) {return value;};所以，iteratee=function(value){return value};
        iteratee = cb(iteratee, context, 1);
        var value = iteratee(obj);
        var low = 0, high = array.length;
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
        }
        return low;
    };

    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function (start, stop, step) {
        if (arguments.length <= 1) {
            stop = start || 0;
            start = 0;
        }
        step = step || 1;
        //Math.round四舍五入, Math,floor地板除, Math.ceil天花板除
        var length = Math.max(Math.ceil((stop - start) / step), 0);
        var range = Array(length);

        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }

        return range;
    };


    //函数的函数：
    // Function (ahem) Functions
    // ------------------

    // Determines whether to execute a function as a constructor
    // or a normal function with the provided arguments
    //执行绑定
    //这里没有对任何参数做判空处理，说明每一个参数都是必传的！
    var executeBound = function (sourceFunc, boundFunc, context, callingContext, args) {
        //callingContext参数是：如果使用了new方法，则callingContext一定是boundFunc函数的实例
        //如果callingContext不是boundFunc的实例，则调用sourceFunc函数并返回，其上下文是context，参数是args
        //这里只是bind函数的第一种用法：改变sourceFunc的上下文，以及传入的默认参数！
        if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);

        //代码执行到这里来的时候，说明callingContext是boundFunc的实例，
        //那么就是说，boundFunc已经作为了构造函数被调用！
        //boundFunc作为构造函数使用的意思就是：sourceFunc绑定的上下文对象context无效，而参数有效！所以这后面根本就没有用到context参数了
        //参考资料：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

        //self对象继承自sourceFunc.prototype对象
        //下面2行代码避开了直接使用new关键字来创建对象的形式，而是使用了最新的方式
        //先创建一个对象self继承自sourceFunc.prototype，然后以self对象作为上下文，
        //以方法的形式调用sourceFunc，这样可以把sourceFunc里面的this指向self，从而根据传入的args扩展self对象，得到sourceFunc里面定义的属性和方法

        //而根据构造函数sourceFunc内部的2种可能实现方式（这里涉及到构造函数的构造原理！），
        //构造函数原理参考代码：
        /**
         function A(x,y){this.x = x; this.y = y;return {name:"yisx"}}
         var a = new A(1, 2);
         var b = A(1, 2);
         console.log(a);//output: Object {name: "yisx"}
         console.log(b);//output: Object {name: "yisx"}

         * **/
        // 该excuteBound函数可能有2种返回结果
        //1，构造函数sourceFunc有显示的返回一个复杂对象result（参考javascript语言精粹），则该构造函数的返回结果就是此复杂对象result,从而把result作为excuteBound函数的返回值！
        //2，构造函数sourceFunc内部并没有显示的返回一个复杂对象，那么，直接扩展self对象之后，再返回self对象！
        var self = baseCreate(sourceFunc.prototype);
        var result = sourceFunc.apply(self, args);
        if (_.isObject(result)) return result;
        //否则直接返回self对象
        return self;
    };

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
    // available.
    //函数式编程：func是target function, context是func将要绑定的上下文
    //bound是bound function
    //_.bind返回值是一个函数，这个函数可以进一步被调用，调用方式有2种：
    //1，直接作为函数被调用：实际上则是调用了func，并且把context作为func的上下文，以及后续的slice.call(arguments, 2)作为func参数调用。这种做法的目的是简化调用同一个上下文的函数代码，并提供预设参数！
    //2，作为构造函数被调用：实际上context上下文已经没有任何意义了，但是后续参数slice.call(arguments, 2)依然会被传入。这种做法的目的是提供预设参数！简化代码！

    //如果nativeBind函数存在的话，则把一切函数处理交给nativeBind函数去执行！
    //第一个参数func必须是函数，否则报错
    _.bind = function (func, context) {
        //如果支持nativeBind，即Function.prototype.bind存在，则直接使用nativeBind函数
        if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
        if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
        //若不支持nativeBind，则第二个参数context为目标函数func即将要绑定的上下文
        //其默认参数也是从第三个开始了
        var args = slice.call(arguments, 2);

        //对bound函数不管是使用new操作符，还是直接执行函数的方式，都是间接的调用了func函数，这个才是最重要的！
        var bound = function () {
            //这下面的this有2中可能：
            //1,如果使用了new操作符，则this是bound构造函数的实例
            //2,如果没有使用new操作符，则this是调用bound的上下文

            //这下面怎么直接把bound传进去了？！递归？!
            return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
        };
        return bound;
    };

    // Partially apply a function by creating a version that has had some of its
    // arguments pre-filled, without changing its dynamic `this` context. _ acts
    // as a placeholder, allowing any combination of arguments to be pre-filled.
    _.partial = function (func) {
        //从arguments里面取出第二个及后面所有的参数,即不包括func的所有参数
        var boundArgs = slice.call(arguments, 1);
        var bound = function () {
            var position = 0, length = boundArgs.length;
            var args = Array(length);
            for (var i = 0; i < length; i++) {
                args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
            }
            while (position < arguments.length) args.push(arguments[position++]);
            return executeBound(func, bound, this, this, args);
        };
        return bound;
    };

    // Bind a number of an object's methods to that object. Remaining arguments
    // are the method names to be bound. Useful for ensuring that all callbacks
    // defined on an object belong to it.
    //obj是一个对象，而后续参数则是该对象里面的方法名字，那些想要绑定到该obj对象上的方法的名字
    _.bindAll = function (obj) {
        var i, length = arguments.length, key;
        if (length <= 1) throw new Error('bindAll must be passed function names');
        for (i = 1; i < length; i++) {
            key = arguments[i];
            obj[key] = _.bind(obj[key], obj);
        }
        return obj;
    };

    // Memoize an expensive function by storing its results.
    _.memoize = function (func, hasher) {
        var memoize = function (key) {
            var cache = memoize.cache;
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
        };
        memoize.cache = {};
        return memoize;
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function (func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function () {
            return func.apply(null, args);
        }, wait);
    };

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = _.partial(_.delay, _, 1);

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time. Normally, the throttled function will run
    // as much as it can, without ever going more than once per `wait` duration;
    // but if you'd like to disable the execution on the leading edge, pass
    // `{leading: false}`. To disable execution on the trailing edge, ditto.
    _.throttle = function (func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function () {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function () {
            var now = _.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function (func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function () {
            var last = _.now() - timestamp;

            if (last < wait && last >= 0) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                }
            }
        };

        return function () {
            context = this;
            args = arguments;
            timestamp = _.now();
            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }

            return result;
        };
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function (func, wrapper) {
        return _.partial(wrapper, func);
    };

    // Returns a negated version of the passed-in predicate.
    //对predicate函数值取反
    _.negate = function (predicate) {
        return function () {
            return !predicate.apply(this, arguments);
        };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function () {
        var args = arguments;
        var start = args.length - 1;
        return function () {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) result = args[i].call(this, result);
            return result;
        };
    };

    // Returns a function that will only be executed on and after the Nth call.
    _.after = function (times, func) {
        return function () {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // Returns a function that will only be executed up to (but not including) the Nth call.
    _.before = function (times, func) {
        var memo;
        return function () {
            if (--times > 0) {
                memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
        };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = _.partial(_.before, 2);

    // Object Functions
    // ----------------

    // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
    //一个枚举IE9以下的枚举bug，如果对象的某个属性，在其作用域链上有一个相同的属性，且是不可枚举的，那么，在ie9以下用for in 循环也无法遍历出来
    //如果一个对象包含了其原型上的某个不可枚举的属性，那么该属性还是可以枚举出来的,但是，在ie9里面，toString属性是不会被枚举，是ie9的bug
    //参考资料：https://developer.mozilla.org/zh-CN/docs/ECMAScript_DontEnum_attribute
    var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
    //以下是常用的不可枚举的属性
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
        'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    //收集不可枚举对象
    function collectNonEnumProps(obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;
        //如果constructor是函数，那么，proto就是该函数的原型对象，否则，proto就是Object.prototype对象
        //这里的目的是，取obj的原型，用于在后面判断当前obj的某一个属性值，是否和其原型上的属性值相等
        var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

        // Constructor is a special case.
        var prop = 'constructor';
        //对于constructor而言，如果obj包含了该属性，并且该属性不在keys里面，那么，将其push进keys里面
        //如果没有手动指定某一个对象o的constructor属性，比如，o={}, 或者o = new F(), 那么o.hasOwnProperty('constructor') 始终返回false
        //如果指定了，即o.constructor = function(){},那么，o.hasOwnProperty('constructor')返回true
        if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            //只有prop属性在obj里面，并且其值不等于该obj的原型上该属性的值，并且，keys里面不包含该key的情况下，就将该prop值push进keys数组
            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    }

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    //返回一个对象所有的自有keys！即非原型上的key
    _.keys = function (obj) {
        //如果不是Object，则直接返回空数组
        if (!_.isObject(obj)) return [];

        //如果支持Object.keys方法，则直接使用Object.keys方法返回结果
        if (nativeKeys) return nativeKeys(obj);

        //如果不支持，则使用遍历对象的方式，来生成一个数组
        var keys = [];
        for (var key in obj) if (_.has(obj, key)) keys.push(key);
        // Ahem, IE < 9.

        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    // Retrieve all the property names of an object.
    //比_.keys少了一行判断代码：(_.has(obj, key))
    _.allKeys = function (obj) {
        if (!_.isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        // Ahem, IE < 9.
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    // Retrieve the values of an object's properties.
    //返回一个对象所有的自有值（非原型链上的值），对应函数：_.keys
    _.values = function (obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };

    // Returns the results of applying the iteratee to each element of the object
    // In contrast to _.map it returns an object
    _.mapObject = function (obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = _.keys(obj),
            length = keys.length,
            results = {},
            currentKey;
        for (var index = 0; index < length; index++) {
            currentKey = keys[index];
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    // Convert an object into a list of `[key, value]` pairs.
    _.pairs = function (obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }
        return pairs;
    };

    // Invert the keys and values of an object. The values must be serializable.
    //invert: 使转化
    //该函数使一个对象的key和value位置对调,并返回新对象
    _.invert = function (obj) {
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };

    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function (obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };

    // Extend a given object with all the properties in passed-in object(s).
    _.extend = createAssigner(_.allKeys);

    // Assigns a given object with all the own properties in the passed-in object(s)
    // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
    //只拷贝自有属性！全部覆盖！
    //由于这里只传入了第一个参数，那么，第二个参数就是undefined，为false，即createAssigner函数的第二个参数undefinedOnly为false，
    //所以，_.extendOwn和_.assign函数的所有对象参数，后面的将会覆盖前面的
    //而第一个参数掺入的是_.keys函数，
    _.extendOwn = _.assign = createAssigner(_.keys);

    // Returns the first key on an object that passes a predicate test
    //找到对象里面第一个出现的key：这个key必须满足predicate函数返回值为true
    _.findKey = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _.keys(obj), key;
        for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            if (predicate(obj[key], key, obj)) return key;
        }
    };

    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function (object, oiteratee, context) {
        var result = {}, obj = object, iteratee, keys;
        if (obj == null) return result;
        if (_.isFunction(oiteratee)) {
            keys = _.allKeys(obj);
            iteratee = optimizeCb(oiteratee, context);
        } else {
            keys = flatten(arguments, false, false, 1);
            iteratee = function (value, key, obj) {
                return key in obj;
            };
            obj = Object(obj);
        }
        for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            if (iteratee(value, key, obj)) result[key] = value;
        }
        return result;
    };

    // Return a copy of the object without the blacklisted properties.
    //omit: 省略
    _.omit = function (obj, iteratee, context) {
        if (_.isFunction(iteratee)) {
            iteratee = _.negate(iteratee);
        } else {
            var keys = _.map(flatten(arguments, false, false, 1), String);
            iteratee = function (value, key) {
                return !_.contains(keys, key);
            };
        }
        return _.pick(obj, iteratee, context);
    };

    // Fill in a given object with default properties.
    _.defaults = createAssigner(_.allKeys, true);

    // Create a (shallow-cloned) duplicate of an object.
    //这是一个浅拷贝函数:
    _.clone = function (obj) {
        //如果不是object,则直接返回就行
        if (!_.isObject(obj)) return obj;
        //如果是数组,则调用slice函数,不传入任何参数,就会返回一个拷贝
        //如果是一个对象,则调用_.extend把obj上的属性拷贝到一个空对象{}上去
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function (obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    // Returns whether an object has a given set of `key:value` pairs.
    //对象object是否包含attrs对象里面所有的键值对，注意，attrs不是数组，是对象！对象！对象！
    _.isMatch = function (object, attrs) {
        var keys = _.keys(attrs), length = keys.length;
        //如果object是个null
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            //出现任何一个key让2者不相等，或者key in obj返回false的话，就返回false
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        //否则返回true
        return true;
    };


    // Internal recursive comparison function for `isEqual`.
    var eq = function (a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // A strict comparison is necessary because `null == undefined`.
        if (a == null || b == null) return a === b;
        // Unwrap any wrapped objects.
        if (a instanceof _) a = a._wrapped;
        if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                _.isFunction(bCtor) && bCtor instanceof bCtor)
                && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            var keys = _.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (_.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    };

    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function (a, b) {
        return eq(a, b);
    };

    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function (obj) {
        if (obj == null) return true;
        if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
        return _.keys(obj).length === 0;
    };

    // Is a given value a DOM element?
    _.isElement = function (obj) {
        return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function (obj) {
        return toString.call(obj) === '[object Array]';
    };

    // Is a given variable an object?
    //不是object的对象有:undefined, number, string, boolean
    //特别注意，typeof null === 'object'返回true，这也就是说，null也是一个object
    _.isObject = function (obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function (name) {
        _['is' + name] = function (obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });

    // Define a fallback version of the method in browsers (ahem, IE < 9), where
    // there isn't any inspectable "Arguments" type.
    //判断arguments是否有callee属性就好
    if (!_.isArguments(arguments)) {
        _.isArguments = function (obj) {
            return _.has(obj, 'callee');
        };
    }

    // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
    // IE 11 (#1621), and in Safari 8 (#1929).
    //1,下面/ ./是一个正则表达式
    //2,Int8Array参考资料：https://msdn.microsoft.com/zh-cn/library/br212462(v=vs.94).aspx
    //3,使用typeof去判断一个为定义的值的时候，将会返回undefined
    if (typeof /./ != 'function' && typeof Int8Array != 'object') {
        _.isFunction = function (obj) {
            return typeof obj == 'function' || false;
        };
    }

    // Is a given object a finite number?
    _.isFinite = function (obj) {
        return isFinite(obj) && !isNaN(parseFloat(obj));
    };

    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    _.isNaN = function (obj) {
        return _.isNumber(obj) && obj !== +obj;
    };

    // Is a given value a boolean?
    _.isBoolean = function (obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    // Is a given value equal to null?
    _.isNull = function (obj) {
        return obj === null;
    };

    // Is a given variable undefined?
    _.isUndefined = function (obj) {
        return obj === void 0;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    //函数式编程，判断obj是否有自有属性key
    _.has = function (obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    };

    // Utility Functions
    // -----------------

    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function () {
        root._ = previousUnderscore;
        return this;
    };

    // Keep the identity function around for default iteratees.
    //直接返回参数的一个函数，不明白什么意思
    _.identity = function (value) {
        return value;
    };

    // Predicate-generating functions. Often useful outside of Underscore.
    //生成一个返回固定value的函数
    _.constant = function (value) {
        return function () {
            return value;
        };
    };

    //空函数
    _.noop = function () {
    };

    //生成函数的函数：
    //_.property生成一个函数，该函数参数是一个obj对象，返回obj对象中键为参数key的值，没有就返回undefined
    _.property = function (key) {
        return function (obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    // Generates a function for a given object that returns a given property.
    //又一个生成函数的函数：生成一个返回对象属性值的函数
    _.propertyOf = function (obj) {
        return obj == null ? function () {
        } : function (key) {
            return obj[key];
        };
    };

    // Returns a predicate for checking whether an object has a given set of
    // `key:value` pairs.
    //_.matcher生成一个函数，该函数用于判断某一个对象obj是否包含指定对象attrs
    //注意，这里attrs也是一个对象！对象！对象！
    _.matcher = _.matches = function (attrs) {
        //这里是把attrs的自有属性拷贝到{}对象上来
        attrs = _.extendOwn({}, attrs);
        return function (obj) {
            return _.isMatch(obj, attrs);
        };
    };

    // Run a function **n** times.
    //函数功能: 返回n个函数的数组,该n个函数的特征: 执行上下文是context, 函数参数仅1个
    _.times = function (n, iteratee, context) {
        var accum = Array(Math.max(0, n));
        iteratee = optimizeCb(iteratee, context, 1);
        for (var i = 0; i < n; i++) accum[i] = iteratee(i);
        return accum;
    };

    // Return a random integer between min and max (inclusive).
    _.random = function (min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        //Math.random() 函数返回 [0-1) 的浮点值伪随机数（大于等于0，小于1）。
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    // A (possibly faster) way to get the current timestamp as an integer.
    //获取当前的时间的毫秒数
    _.now = Date.now || function () {
        return new Date().getTime();
    };

    // List of HTML entities for escaping.
    //转移字符的实体
    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    };

    var unescapeMap = _.invert(escapeMap);

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    var createEscaper = function (map) {
        var escaper = function (match) {
            return map[match];
        };
        // Regexes for identifying a key that needs to be escaped
        //根据传入的参数map的keys生成一个正则表达式,
        // 比如,传入escapeMap,则生成表达式的字符串源是这样的: '(?:&|<|>|"|'|`)'
        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        //全局替换正则
        var replaceRegexp = RegExp(source, 'g');
        return function (string) {
            //如果string参数是null,则将其转成空字符串'',否则,将string直接转成字符串,而无论string是数组,或者是对象,或者是undefined等等
            string = string == null ? '' : '' + string;
            //如果有任何匹配到了要替换的正则,则使用字符串的replace函数全局替换,否则,直接返回原始字符串
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };
    //转义函数
    _.escape = createEscaper(escapeMap);
    //反转义函数
    _.unescape = createEscaper(unescapeMap);

    // If the value of the named `property` is a function then invoke it with the
    // `object` as context; otherwise, return it.
    //void 0:表示执行一个表达式,但是不返回任何值:其实就是返回undefined, void 0 === undefined为true
    //如果object不为null,并且object[property]是一个函数,则以object为上下文,执行该函数object[property], 否则降级执行fallback函数
    //当然,如果object[property]不是函数,或者fallback也不是函数,那么,就直接返回该值了
    _.result = function (object, property, fallback) {
        var value = object == null ? void 0 : object[property];
        if (value === void 0) {
            value = fallback;
        }
        return _.isFunction(value) ? value.call(object) : value;
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.

    var idCounter = 0;
    //生成唯一id, 每调用一次_.uniqueId,就生成一个在原来的基础之上累加1个值
    _.uniqueId = function (prefix) {
        //这里先将idCounter累加1, 并通过加一个空字符串将数字转换成字符串,然后再赋值给id,

        var id = ++idCounter + '';
        //如果有前缀,则添加前缀,否则不加
        return prefix ? prefix + id : id;
    };

    // By default, Underscore uses ERB-style template delimiters(分隔符), change the
    // following template settings to use alternative delimiters.
    //
    _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function (match) {
        return '\\' + escapes[match];
    };

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    // NB: `oldSettings` only exists for backwards compatibility.
    _.template = function (text, settings, oldSettings) {
        if (!settings && oldSettings) settings = oldSettings;
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offest.
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + 'return __p;\n';

        try {
            var render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        var template = function (data) {
            return render.call(this, data, _);
        };

        // Provide the compiled source as a convenience for precompilation.
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';

        return template;
    };

    // Add a "chain" function. Start chaining a wrapped Underscore object.
    _.chain = function (obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    };

    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // Helper function to continue chaining intermediate results.
    var result = function (instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };

    // Add your own custom functions to the Underscore object.
    _.mixin = function (obj) {
        _.each(_.functions(obj), function (name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function () {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result(this, func.apply(_, args));
            };
        });
    };

    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
        var method = ArrayProto[name];
        _.prototype[name] = function () {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result(this, obj);
        };
    });

    // Add all accessor Array functions to the wrapper.
    _.each(['concat', 'join', 'slice'], function (name) {
        var method = ArrayProto[name];
        _.prototype[name] = function () {
            return result(this, method.apply(this._wrapped, arguments));
        };
    });

    // Extracts the result from a wrapped and chained object.
    _.prototype.value = function () {
        return this._wrapped;
    };

    // Provide unwrapping proxy for some methods used in engine operations
    // such as arithmetic and JSON stringification.
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function () {
        return '' + this._wrapped;
    };

    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    if (typeof define === 'function' && define.amd) {
        define('underscore', [], function () {
            return _;
        });
    }
}.call(this));
