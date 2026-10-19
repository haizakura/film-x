export const useTranslatedError = () => {
  const { t, te } = useI18n()

  return (message: string, fallbackKey: string) => (te(message) ? t(message) : t(fallbackKey))
}
