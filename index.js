const fs = require('fs');
const modules = {};

function stat(filename) {
    return Promise(function (resolve, reject) {
        fs.stat(filename, function (error, stats) {
            if (error) {
                reject(error);
            } else {
                resolve(stats);
            }
        });
    });
}

function readFile(filename) {
    return Promise(function (resolve, reject) {
        fs.readFile(filename, {encoding: 'utf8'}, function (error, content) {
            if (error) {
                reject(error);
            } else {
                resolve(content);
            }
        });
    });
}

function dynamicRequire(filename) {
    if (!modules[filename]) {
        return readFile(filename)
            .then(function (content) {
                const exports = {};
                const module = {exports};
                eval(content);
                modules[filename] = {
                    time: Date.now(),
                    module: module,
                };

                return Object.assign({}, exports, {
                    changed: true,
                });
            });
    } else {
        return stat(filename)
            .then(function (stat) {
                if (modules[filename].time > Number(stat.mtime)) {

                    return Object.assign({}, modules[filename].module.exports, {
                        changed: false,
                    });
                } else {
                    return readFile(filename)
                        .then(function (content) {
                            const exports = {};
                            const module = {exports};
                            eval(content);
                            modules[filename] = {
                                time: stat.mtime,
                                module: module,
                            };

                            return Object.assign({}, exports, {
                                changed: true
                            });
                        });
                }
            });

    }
}

function dynamicRequireSync(filename) {
    if (!modules[filename]) {
        const exports = {};
        const module = {exports};
        eval(fs.readFileSync(filename, {encoding: 'utf8'}));
        modules[filename] = {
            time: Date.now(),
            module: module,
        };

        return Object.assign({}, exports, {
            changed: true,
        });
    } else {
        const stat = fs.statSync(filename);
        if (modules[filename].time > Number(stat.mtime)) {

            return Object.assign({}, modules[filename].module.exports, {
                changed: false,
            });
        } else {
            const exports = {};
            const module = {exports};
            eval(fs.readFileSync(filename, {encoding: 'utf8'}));
            modules[filename] = {
                time: stat.mtime,
                module: module,
            };

            return Object.assign({}, exports, {
                changed: true,
            });
        }
    }
}

module.exports = {
    dynamicRequire: dynamicRequire,
    dynamicRequireSync: dynamicRequireSync
};
