"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.KeyStyle = exports.CredentialType = void 0;
var CredentialType;
(function (CredentialType) {
    CredentialType["ServiceAccount"] = "serviceAccount";
    // apiKey method is readonly
    // TODO: | "apiKey" | "OAuth"
})(CredentialType = exports.CredentialType || (exports.CredentialType = {}));
var KeyStyle;
(function (KeyStyle) {
    KeyStyle["Nested"] = "nested";
    KeyStyle["Flat"] = "flat";
})(KeyStyle = exports.KeyStyle || (exports.KeyStyle = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["Silent"] = "silent";
    LogLevel["Error"] = "error";
    LogLevel["Warn"] = "warn";
    LogLevel["Info"] = "info";
    LogLevel["Debug"] = "debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
//# sourceMappingURL=i18nGSConfig.js.map