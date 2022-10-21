import i18nGSConfig, {
  CredentialType,
  KeyStyle,
  LogLevel,
} from "../types/i18nGSConfig";
import * as Joi from "joi";
import { exit } from "./log";

export function validateConfig(config: i18nGSConfig) {
  const schema = Joi.object<i18nGSConfig>({
    spreadsheet: Joi.object<i18nGSConfig["spreadsheet"]>({
      sheetId: Joi.string().required(),
      credential: Joi.object<i18nGSConfig["spreadsheet"]["credential"]>({
        type: Joi.string().valid(CredentialType.ServiceAccount).required(),
        path: Joi.string().required(),
      }),
    }),
    i18n: Joi.object<i18nGSConfig["i18n"]>({
      path: Joi.string().required(),
      keyStyle: Joi.string().valid(KeyStyle.Nested, KeyStyle.Flat).required(),
      locales: Joi.object<i18nGSConfig["i18n"]["locales"]>({
        includes: Joi.array().items(Joi.string()),
        excludes: Joi.array().items(Joi.string()),
      }),
      namespaces: Joi.object<i18nGSConfig["i18n"]["namespaces"]>({
        includes: Joi.array().items(Joi.string()),
        excludes: Joi.array().items(Joi.string()),
      }),
    }),
    logging: Joi.object<i18nGSConfig["logging"]>({
      level: Joi.string().valid(
        LogLevel.Error,
        LogLevel.Warn,
        LogLevel.Info,
        LogLevel.Debug,
        LogLevel.Silent
      ),
    }),
  });

  const { error } = schema.validate(config);

  if (error) exit(`Config ${error.message}`);
}
