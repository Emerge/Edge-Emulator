global.has = function (obj, key) {
    if (obj === undefined || obj === null)
        return false;
    return obj.hasOwnProperty(key);
};
function Type(obj) {
    if (obj === undefined)
        return "undefined";
    if (obj === null)
        return "null";
    var text = Function.prototype.toString.call(obj.constructor);
    return text.match(/function (.*)\(/)[1];
}
var NOTHING = Object.create({});
function deep_delta(o, delta, override, pretend) {
    if (override === void 0) { override = true; }
    if (pretend === void 0) { pretend = false; }
    var change_level = Object.create({});
    for (var i in delta) {
        if (!has(delta, i))
            continue;
        if (Type(delta[i]) == "Function")
            continue;
        if (!has(o, i)) {
            if (!pretend)
                o[i] = delta[i];
            change_level[i] = delta[i];
        }
        else if (!override || Type(o[i]) == "Function") {
            continue;
        }
        else if ((Type(o[i]) !== Type(delta[i]) ||
            !_.isObject(o[i]) ||
            !_.isObject(delta[i])) && !_.isEqual(o[i], delta[i])) {
            if (!pretend) {
                o[i] = delta[i];
            }
            change_level[i] = delta[i];
        }
        else if (!_.isEqual(o[i], delta[i])) {
            change_level[i] = deep_delta(o[i], delta[i], override);
        }
        if (change_level[i] === NOTHING) {
            delete change_level[i];
        }
    }
    if (Object.keys(change_level).length === 0)
        return NOTHING;
    return change_level;
}
global.deep_delta = deep_delta;
global.delta_add = function (o, plus, override) {
    //for (var i in plus) {
    //    if ((override || !o.has(i))) {
    //        o[i] = plus[i];
    //    }
    //}
    //return o;
    if (override === void 0) { override = true; }
    deep_delta(o, plus, override);
    return o;
};
global.delta_add_return_changes = function (o, plus, override, pretend) {
    //var change = {};
    //for (var i in plus) {
    //    if (((override && !_.isEqual(plus[i], o[i])) || !o.has(i))) {
    //        o[i] = plus[i];
    //        change[i] = plus[i];
    //    }
    //}
    //return change;
    if (override === void 0) { override = true; }
    if (pretend === void 0) { pretend = false; }
    var change = deep_delta(o, plus, override, pretend);
    if (change === NOTHING)
        return {};
    return change;
};
global.delta_mod = function (o, mod) {
    deep_delta(o, mod, false);
    return o;
};
