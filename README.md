# i18n-gs

This tool is to support Google Sheets upload and download i18n json file.

# Install

```console
npm install i18n-gs --save-dev
```

or

```console
yarn add i18n-gs --dev
```

# Usage

Use `i18ngs` command to run from command line

## Init

Initialize the project with config file

```console
i18ngs init
```

## Upload

Upload the files to google sheet (only support flat key style)

```console
i18ngs upload [namespaces...]

Options:
  -l, --locales <locales...>  locales to be included
```

- Example:

```console
i18ngs upload
i18ngs upload common
i18ngs upload common --locales en
```

## Download

Download the files from google sheet

```console
i18ngs download [namespaces...]

Options:
  -l, --locales <locales...>  locales to be included
```

- Example:

```console
i18ngs download
i18ngs download common
i18ngs download common --locales en
```

# Authentication

### Service Account:

Setup a service account and share sheet's editor permission to the service account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Search for "Google Sheets API" and enable it
4. Search for "Service Accounts"
5. Click "+ Create Service Account" and follow the steps to create service account
6. Save the generated JSON credential file to local (or your project root folder)
7. Update the configuration file

# Configuration

Create a file `i18n-gs.config.js` in the project root

### Example

```javascript
module.exports = {
  spreadsheet: {
    sheetId: "<your sheet id>",
    credential: {
      type: "serviceAccount",
      path: "<your credential file path>",
    },
  },
  i18n: {
    path: "<your locale directory path>",
    keyStyle: "nested",
  },
  logging: {
    level: "info",
  },
};
```

## `i18n-gs.config.js` fields

## spreadsheet.sheetId

Specifies the id of your google sheet

- Type: `string`
- Example:

```javascript
module.exports = {
  spreadsheet: {
    sheetId: "<your sheet id>",
  },
};
```

## spreadsheet.credential.type

Specifies the method to connect google sheet (Only support service account for now)

- Type: `'serviceAccount'`
- Example:

```javascript
module.exports = {
  spreadsheet: {
    credential: {
      type: "serviceAccount",
    },
  },
};
```

## spreadsheet.credential.path

Specifies the path to your credential file (Applicable to service account)

- Type: `string`
- Example:

```javascript
module.exports = {
  spreadsheet: {
    credential: {
      path: "<your credential file path>",
    },
  },
};
```

## i18n.path

Specifies the path to store your locales files

- Type: `string`
- Example:

```javascript
module.exports = {
  i18n: {
    path: "<your locale directory path>",
  },
};
```

## i18n.keyStyle

Style of the i18n key on local file

- Type: `'nested' | 'flat'`
- Example:

```javascript
module.exports = {
  i18n: {
    keyStyle: "nested",
  },
};
```

The key style is as follows:

```javascript
{
  // nested:
  blog: {
    section: {
      title: "My first blog";
    }
  },
  // flat:
  blog.section.title: "My first blog"
}
```

## i18n.locales.includes

Specifies the locales to include when upload / download

- Type: `string[]`
- Example:

```javascript
module.exports = {
  i18n: {
    locales: {
      includes: ["en", "ja"],
    },
  },
};
```

## i18n.locales.excludes

Specifies the locales to exclude when upload / download

- Type: `string[]`
- Example:

```javascript
module.exports = {
  i18n: {
    locales: {
      excludes: ["de", "fr"],
    },
  },
};
```

## i18n.namespaces.includes

Specifies the namespaces to include when upload / download

- Type: `string[]`
- Example:

```javascript
module.exports = {
  i18n: {
    namespaces: {
      includes: ["common", "glossary"],
    },
  },
};
```

## i18n.namespaces.excludes

Specifies the namespaces to exclude when upload / download

- Type: `string[]`
- Example:

```javascript
module.exports = {
  i18n: {
    namespaces: {
      excludes: ["local", "debug"],
    },
  },
};
```

## logging.level

Specifies the log level

- Type: `'silent' | 'error' | 'warn' | 'info' | 'debug'`
- Example:

```javascript
module.exports = {
  logging: {
    level: "info",
  },
};
```
