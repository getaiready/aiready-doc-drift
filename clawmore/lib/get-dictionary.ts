import 'server-only';

const dictionaries = {
  en: () => import('../messages/en.json').then((module) => module.default),
  zh: () => import('../messages/zh.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  const dictionary =
    dictionaries[locale as keyof typeof dictionaries] || dictionaries.en;
  return dictionary();
};
