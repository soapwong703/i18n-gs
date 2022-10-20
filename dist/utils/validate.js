"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = void 0;
const i18nGSConfig_1 = require("../types/i18nGSConfig");
const Joi = require("joi");
const log_1 = require("./log");
function validateConfig(config) {
    const schema = Joi.object({
        spreadsheet: Joi.object({
            sheetId: Joi.string().required(),
            credential: Joi.object({
                type: Joi.string().valid(i18nGSConfig_1.CredentialType.ServiceAccount).required(),
                path: Joi.string().required(),
            }),
        }),
        i18n: Joi.object({
            path: Joi.string().required(),
            keyStyle: Joi.string().valid(i18nGSConfig_1.KeyStyle.Nested, i18nGSConfig_1.KeyStyle.Flat).required(),
            locales: Joi.object({
                includes: Joi.array().items(Joi.string()),
                excludes: Joi.array().items(Joi.string()),
            }),
            namespaces: Joi.object({
                includes: Joi.array().items(Joi.string()),
                excludes: Joi.array().items(Joi.string()),
            }),
        }),
        logging: Joi.object({
            level: Joi.string().valid(i18nGSConfig_1.LogLevel.Error, i18nGSConfig_1.LogLevel.Warn, i18nGSConfig_1.LogLevel.Info, i18nGSConfig_1.LogLevel.Debug),
        }),
    });
    const { error } = schema.validate(config);
    if (error)
        (0, log_1.exit)(`Config ${error.message}`);
}
exports.validateConfig = validateConfig;
//# sourceMappingURL=validate.js.map