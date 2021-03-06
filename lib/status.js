var status = {};

status.NETWORK = {};
status.NETWORK.arp = require('../datasource/arp.json');
status.NETWORK.leases = require('../datasource/leases.json');
status.NETWORK.network = require('../datasource/network.json');
status.NETWORK.mdns = {
    "192.168.66.10": {}
};
status.NETWORK.ssdp = require('../datasource/ssdp.json');
status.NETWORK.p0f = {};
status.NETWORK.link = require('../datasource/link.json');
status.NETWORK.addr = require('../datasource/addr.json');

status.WLAN2G = {};
status.WLAN2G.stations = require('../datasource/stations.json');
status.WLAN2G.devices = {
    "60:d9:c7:41:d4:71": true
};

status.WLAN5G = {};
status.WLAN5G.stations = {};
status.WLAN5G.devices = {};

status.TRAFFIC = {};
status.TRAFFIC.traffics = require('../datasource/traffics.json');
status.TRAFFIC.system = require('../datasource/system.json');

module.exports.status = status;

var devices = require('../datasource/devices.json');

module.exports.devices = devices;

var hwaddr_map = require('../datasource/hwaddr_map.json');
module.exports.GetDevIdByHWAddr = function (mac) {
    mac = ("" + mac).toLowerCase();
    for (var busName in hwaddr_map) {
        if (has(hwaddr_map[busName], mac)) {
            return hwaddr_map[busName][mac];
        }
    }
    return undefined;
};
function List(ops) {
    ops = ops || {};
    var bus = Object.keys(hwaddr_map);
    var owner = ops.owner;
    var state = ops.state;
    if (ops.bus) {
        if (typeof bus === "string") {
            bus = [ops.bus];
        }
        else if (Array.isArray(ops.bus)) {
            bus = ops.bus;
        }
    }
    var r = {};
    for (var i = 0; i < bus.length; i++) {
        var b = bus[i];
        if (!hwaddr_map[b])
            continue;
        for (var j in hwaddr_map[b]) {
            var devId = hwaddr_map[b][j];
            var dev = devices[devId];
            if (devId && dev
                && (state === undefined || state === dev.state)
                && (owner === undefined || owner === dev.owner)) {
                r[devId] = dev;
            }
        }
    }
    return r;
};
module.exports.List = List;
module.exports.FromBus = function (hwaddr, bus) {
    if (hwaddr_map[bus] && hwaddr_map[bus][hwaddr]) {
        return devices[hwaddr_map[bus][hwaddr]];
    }
    return undefined;
};
module.exports.Config = function (dev, conf) {
    var devId = hwaddr_map[dev.bus.name][dev.bus.hwaddr];
    var dev;
    if (devId && devices[devId]) {
        dev = devices[devId];
        if (!dev.config) {
            dev.config = {};
        }
        var dt = delta_add_return_changes(dev.config, JSON.parse(JSON.stringify(conf)), true);
        if (Object.keys(dt).length == 0) {
            console.log("Config Found No Change, Skipped");
            return;
        }
    }
    else {
        return console.log("Device not found");
    }
};
module.exports.SetOwnership = function (devId, ownership) {
    var dev;
    if (devId && devices[devId]) {
        console.log("Setting Ownership of : " + devId + " TO " + ownership);
        dev = devices[devId];
        if (dev.owner === ownership) {
            console.log("Ownership Found No Change, Skipped");
            return;
        }
        //exports.Events.emit("transfer", dev.id, dev, ownership, dev.owner);
        dev.owner = ownership;
    }
    else {
        console.log("Device not found");
    }
};
module.exports.getTraffic = function () {
    var serializedDevice = JSON.parse(JSON.stringify(status.TRAFFIC.traffics));
    var serializedSystem = JSON.parse(JSON.stringify(status.TRAFFIC.system));
    return {
        device: serializedDevice,
        system: serializedSystem
    };
};
module.exports.getStations = function () {
    var stations2G4 = JSON.parse(JSON.stringify(status.WLAN2G.stations));
    var stations5G7 = JSON.parse(JSON.stringify(status.WLAN5G.stations));
    return {
        station2G: stations2G4,
        station5G: stations5G7
    };
};
module.exports.GetDeviceByIp = function (ip) {
    for (var i in devices) {
        if (devices[i].bus.data.Lease.Address === ip)
            return devices[i];
    }
    return undefined;
};

var pooled = require('../datasource/pooled.json');
module.exports.pooled = pooled;

var users = require('../datasource/users.json');
module.exports.GetOwnedDevices = function (userid, ops) {
    ops = ops || {};
    var usr = users[userid];
    if (!usr) {
        return {};
    }
    else {
        return List({
            bus: ops.bus,
            owner: userid,
            state: ops.state
        });
    }
};
module.exports.UserList = function (opts) {
    opts = opts || {};
    var results = {};
    for (var i in users) {
        if ((opts.state === undefined ||
            (opts.state === 1))) {
            results[i] = users[i];
        }
    }
    return results;
};
module.exports.UserAll = function () {
    return users;
};
module.exports.UserGet = function (userid) {
    return users[userid];
};
module.exports.UserGetState = function (userid) {
    return 1;
};
module.exports.UserCurrent = function () {
    var k = Object.keys(users)[0];
    return users[k];
};

var messages = require('../datasource/messages.json');
module.exports.MsgRawQuery = function (opts) {
    var res = [];
    for (var i in messages)
        res.push(messages[i]);
    return res;
};
module.exports.Timeline = function (receiver, receiverType, page, total) {
    var res = [];
    for (var i in messages)
        if (messages[i].timeline === true)
            res.push(messages[i]);
    return res;
};
module.exports.GetNotifications = function (receiver, receiverType, page, total) {
    var res = [];
    for (var i in messages)
        if (messages[i].notice === true)
            res.push(messages[i]);
    return res;
};
module.exports.FirewallConfig = function () {
    return {
        NAT: {
            WLAN2G: true,
            WLAN5G: true,
            WLAN2G_Guest: true,
            WLAN5G_Guest: true
        },
        VLAN_Isolation: {
            WLAN2G: false,
            WLAN5G: false,
            WLAN2G_Guest: true,
            WLAN5G_Guest: true
        },
        BlockedRemoteAddresses: [],
        EnableNginxProxy: true
    };
};
module.exports.Wlan2gConfig = function () {
    return  {
        Power: true,
        SSID: "Edge One 2G",
        AutoSSID: false,
        Visible: true,
        Channel: 4,
        Password: undefined,
        Bridge: 'br0',
        Aux: { //GuestWifi
            "0": {
                Power: false,
                SSID: undefined,
                Password: undefined,
                Visible: false
            }
        }
    };;
};
module.exports.Wlan5gConfig = function () {
    return  {
        Power: false,
        SSID: "Edge One 5G",
        AutoSSID: false,
        Visible: true,
        Channel: 36,
        Password: undefined,
        Bridge: 'br0',
        Aux: { //GuestWifi
            "0": {
                Power: false,
                SSID: undefined,
                Password: undefined,
                Visible: false
            }
        }
    };
};
module.exports.BluetoothConfig = function() {
    return {
        HCI: {
            Power: true,
            Name: "Edge-Router",
            Hidden: false
        },
        Audio: {
            Power: true,
            Name: "Edge-Router-Audio",
            Hidden: false
        }
    };
};

module.exports.QueryIntentions = function(intention, cb){
    var responses = [];
    for(var i = 0, len = intention.objs.length; i < len; i++){
        var res = {
            appid: 'Launcher',
            obj: intention.objs[i],
            results: [
                {
                    icon: 'http://global.wifi.network/assets/icons/chat.png',
                    tip: 'chat',
                    action: 'http://wifi.network/messager/#1'
                },
                {
                    icon: 'http://global.wifi.network/assets/icons/send.png',
                    tip: 'send',
                    action: 'http://wifi.network/sender/#2'
                }
            ]
        };
        responses.push(res);
    }
    return cb(undefined, responses);
}

module.exports.UpdateUserAvatar = function(userid, avatar) {
    users[userid]['avatar'] = avatar;
    return _dumpJSON('users', users);
};
module.exports.UpdateUserData = function(userid, data) {
    users[userid]['data'] = JSON.stringify(data);
    return _dumpJSON('users', users);
};
function _dumpJSON(name, json) {
    console.log("DUMP JSON".blue, name.green, json);
    fs.writeFileSync("/datasource/" + name + ".json", JSON.stringify(json));
}