const FS = require('fs');
const Path = require('path');
module.exports = (request, options) => {

    if (request === './schema') {
        if (options.basedir.includes('packages')) {
            const filename = Path.join(options.basedir, request);
            if (!FS.existsSync(filename + '.ts'))
                options.basedir = options.basedir.replace('packages', 'target/packages');
        }
        // if (options.basedir === 'D:\\work\\opfx\\proj\\wdtk\\wdtk\\packages\\angular\\src\\schematics\\application') {
        //     options.basedir = 'D:\\work\\opfx\\proj\\wdtk\\wdtk\\target\\packages\\angular\\src\\schematics\\application'
        // }
    }
    // Call the defaultResolver, so we leverage its cache, error handling, etc.
    return options.defaultResolver(request, {
        ...options,
    });
};