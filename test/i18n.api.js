/*jslint nomen: true, undef: true, sloppy: true, white: true, stupid: true, passfail: false, node: true, plusplus: true, indent: 2 */

// now with coverage suport
var i18n = require('../i18n'),
        should = require("should");

i18n.configure({
    directory: './locales',
    register: global,
    availableLocales: ["en", "de"],
    localeFiles: ['test']
});

describe('Module Setup', function () {
    it('should export a valid version', function () {
        should.equal(i18n.version, '0.0.1');
    });
});

describe('i18nGetCatalog', function () {
    it('should return all catalogs when invoked with empty parameters', function () {
        var catalogs = i18n.getCatalog();
        catalogs.should.have.property('en');
        catalogs.en.should.have.property('welcome', 'Welcome');
        catalogs.should.have.property('de');
        catalogs.de.should.have.property('welcome', 'Willkommen');
    });
     it('should return false when invoked with unsupported locale as parameter', function () {
        i18n.getCatalog({ locale: 'oO' }).should.equal(false);
     });
});

describe('i18nTranslate', function () {
    it('should return en translations as expected', function () {
        should.equal(__('welcome'), 'Welcome');
        should.equal(__('fromto', {from: "Berlin", to: "Munich"}), 'Berlin to Munich');
    });

    it('load custom language file with prefix', function () {
        i18n.readFile('custom', 'custom');
        should.equal(__('test'), 'here we are');
    });

    it('should return de translations as expected', function () {
        i18n.setLocale('de');
        should.equal(__('welcome'), 'Willkommen');
        should.equal(__('fromto', {from: "Berlin", to: "Munich"}), 'Berlin nach Munich');
    });
});
