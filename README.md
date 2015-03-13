i18n-nitr
=======

Description

Project is inspired by https://github.com/martinheidegger/i18n-node-yaml

This library provides simple access to yml language files, which can load
dynamically with custom prefix to split it in different scopes

## Install

```bash
$ npm install i18n-nitr
```

## Usage

```js
var i18n = require('i18n-nitr');

i18n.configure({
  directory: './locales',
  register: global,
  availableLocales: ["en", "de"],
  localeFiles: ['test']
});
```

## License 

(The MIT License)

Copyright (c) 2015 marbis GmbH &lt;stefan.reusch@marbis.net&gt;
