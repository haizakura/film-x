export const useTranslatedError = () => {
  const { t, te } = useI18n()

  return (message: string, fallbackKey: string) => {
    if (te(message)) return t(message)
    return message || t(fallbackKey)
  }
}
