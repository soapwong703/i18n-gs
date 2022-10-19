export type i18nRecord = { [key: string]: i18nData };
type i18nData = string | i18nRecord;

export type NamespaceData = {
  [locale: string]: i18nRecord;
};

export type SheetsData = {
  [namespace: string]: NamespaceData;
};
