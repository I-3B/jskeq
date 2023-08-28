# jskeq

a node script to compare two json files keys

## Motivation

I created this simple script to compare translations files, as I sometimes add translations to one file and forget to add the same translation keys to the other languages

## Usage

```bash
cd my-cool-i18n-project;
npx jskeq  localization/en localization/ar
```

if some keys are in one file but not the other it will log them:

```bash
ar/account.json have 2 more keys:
signin.username
signin.password

en/home.json have 1 more keys:
welcoming
```

Meaning `en/account.json` translation file is missing the translation keys `signin.username` and `signin.password`

And `ar/home.json` is missing the translation key `welcoming`

also it works for files:

```bash
npx jskeq en.json ar.json
```
