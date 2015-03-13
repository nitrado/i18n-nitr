var vsprintf = require('sprintf').vsprintf,
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    jsyaml = require('js-yaml'),
    extend = require('node.extend'),
    debug = require('debug')('i18n:debug'),
    warn = require('debug')('i18n:warn'),
    error = require('debug')('i18n:error'),
    Mustache = require('mustache'),
    util = require('util'),
    locales = {},
    api = ['__', '__n', 'getLocale', 'setLocale', 'getCatalog'],
    pathsep = path.sep || '/', // ---> means win support will be available in node 0.8.x and above
    defaultLocale, preferredLocale, availableLocales, localeFiles, directory, extension, indent, yamlSchema;
   

// public exports
var i18n = exports;

i18n.version = '0.0.1';

i18n.configure = function i18nConfigure(opt) {
  // you may register helpers in global scope, up to you
  if (typeof opt.register === 'object') {
    applyAPItoObject(opt.register);
  }

  // where the yaml files are
  directory = (typeof opt.directory === 'string') ? opt.directory : __dirname + pathsep + 'locales';

  // what to use as the indentation unit (ex: "\t", "  ")
  indent = (typeof opt.indent === 'string') ? opt.indent : "\t";
    if (opt.extension === '.yaml') {
        opt.extension = '.yml';
    }
    
  extension = (typeof opt.extension === 'string') ? opt.extension : '.yml';

  // setting defaultLocale
  defaultLocale = (typeof opt.defaultLocale === 'string') ? opt.defaultLocale : 'en';
  
  localeFiles = (util.isArray(opt.localeFiles)) ? opt.localeFiles : ['default'];
  
  availableLocales = (util.isArray(opt.availableLocales)) ? opt.availableLocales : [defaultLocale];

  preferredLocale = (typeof opt.preferredLocale === 'string') ? opt.preferredLocale : defaultLocale;

  // Schema to be used for yaml files (ex: require("js-yaml/lib/js-yaml/schema/default_full"))
  yamlSchema = opt.schema;
  
  localeFiles.forEach(function(f) {
      i18n.readFile(f);
  });
};

i18n.readFile = function i18nReadFile(file, prefix) {
    var prefix = (typeof prefix === 'string') ? prefix : '';
    
    var filepath = path.normalize(__dirname + pathsep + 'locales' + pathsep);
    debug("availableLocales: " + availableLocales.join(', '));
    availableLocales.forEach(function(l) {
        if(locales[l] === undefined)
            locales[l] = {};
        
        var locale = locales[l];

        debug('try to load language file ' + filepath + l + '.' + file + extension);
        try {
            var localeFile = fs.readFileSync(filepath + l + '.' + file + extension).toString();
            try {
                var obj = jsyaml.load(localeFile, {schema: yamlSchema});
                for(var i in obj) {
                    locale[i] = { singular: obj[i], prefix: prefix, file: file };
                }
            } catch (parserError) {
                
            }
        } catch (readError) {
            warn(l + '.' + file + extension + ' not found');
        }
    });
};

i18n.setLocale = function i18nSetLocale(locale) {
  preferredLocale = locale;
  return i18n.getLocale();
};

i18n.getLocale = function i18nGetLocale() {
  // called like getLocale()
  return preferredLocale;
};

/*
    __('Hello'); // Hallo
    __('Hello %s', 'Marcus'); // Hallo Marcus
    __('Hello {{name}}', { name: 'Marcus' }); // Hallo Marcus
    __({phrase: 'Hello', locale: 'fr'}); // Salut
    __({phrase: 'Hello %s', locale: 'fr'}, 'Marcus'); // Salut Marcus
    __({phrase: 'Hello {{name}}, locale: 'fr'}, { name: 'Marcus' }); // Salut Marcus
 */
i18n.__ = function i18nTranslate(phrase) {
    var msg, namedValues, args;
    
    if (arguments.length > 1 &&
        arguments[arguments.length - 1] !== null &&
        typeof arguments[arguments.length - 1] === "object") {
        namedValues = arguments[arguments.length - 1];
        args = Array.prototype.slice.call(arguments, 1, -1);
    } else {
        namedValues = {};
        args = arguments.length >= 2 ? Array.prototype.slice.call(arguments, 1) : [];
    }
    
    // called like __({phrase: "Hello", locale: "en"})
    if (typeof phrase === 'object') {
        if (typeof phrase.locale === 'string' && typeof phrase.phrase === 'string') {
            debug("called like __({phrase: \"" + phrase.phrase + "\", locale: \"" + phrase.locale + "\"})");
            msg = translate(phrase.phrase, { locale: phrase.locale });
        } else {
            error("phrase.locale and phrase.phrase not found");
        }
    }
    // called like __("Hello")
    else {
        debug("called like __(\"" + phrase + "\")");
        msg = translate(phrase);
    }
    
    // if the msg string contains {{Mustache}} patterns we render it as a mini tempalate
    if ((/{{.*}}/).test(msg)) {
        msg = Mustache.render(msg, namedValues);
    }

    // if we have extra arguments with values to get replaced,
    // an additional substition injects those strings afterwards
    if ((/%/).test(msg) && args && args.length > 0) {
        msg = vsprintf(msg, args);
    }
    
    return msg;
};

// ===================
// = private methods =
// ===================
/**
 * registers all public API methods to a given response object when not already declared
 */

function applyAPItoObject(request, response) {

  // attach to itself if not provided
  var object = response || request;
  api.forEach(function (method) {

    // be kind rewind, or better not touch anything already exiting
    if (!object[method]) {
      object[method] = function () {
        return i18n[method].apply(request, arguments);
      };
    }
  });
}

function _translate(key, opts) {
    var locale, translation;
    
    if(opts === undefined)
        opts = {};
    
    if(opts.locale === undefined)
        opts.locale = preferredLocale;
    
    if(locales[opts.locale] === undefined) {
        locale = locales[defaultLocale];
    } else {
        locale = locales[opts.locale];
    }
    
    if(locale[key] === undefined && opts.locale != defaultLocale) {
        debug('key not found in ' + opts.locale + ' locale and is not default locale ' + defaultLocale);
        translation = _translate(key, { locale: defaultLocale });
    }
    
    if(locale[key] === undefined) {
        debug('key not found in ' + opts.locale);
        translation = { singular: key, prefix: "", file: "" };
    } else {
        translation = locale[key];
    }
    
    if(translation === undefined)
        error('no translation found');
    
    return translation;
}

function translate(key, opts) {
    return _translate(key, opts).singular;
}

i18n.getCatalog = function i18ngGetCatalog(opts) {
    var locale = (opts !== undefined && typeof opts.locale === 'string') ? opts.locale : null;
    var prefix = (opts !== undefined && typeof opts.prefix === 'boolean') ? opts.prefix : false;
    
    var catalog = {};
    for(var i in locales) {
        if(locale !== null && locale != i)
            continue;
        
        catalog[i] = {};
        
        for(var j in locales[i]) {
            catalog[i][(prefix?locales[i][j].prefix + j:j)] = translate(locales[i][j].singular, opts);
        }
    }
    
    if(locale !== null && !Object.keys(catalog).length)
        return false;
    
    return catalog;
};
