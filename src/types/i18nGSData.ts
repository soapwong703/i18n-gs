// type i18nData = { [key: string]: i18nGSData } | string;
// type i18nData = Record<string, i18nGSData | string>;

// export type i18nGSData = { [key: string]: i18nData };

type i18nRecord = { [key: string]: i18nData };
type i18nData = string | i18nRecord;

export type NamespaceData = {
  [locale: string]: Record<string, i18nRecord>;
};

export type SheetsData = {
  [namespace: string]: NamespaceData;
};
