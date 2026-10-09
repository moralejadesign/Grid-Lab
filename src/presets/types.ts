export type Preset = {
  id: string
  name: string
  background: string
  /** Hairline weight at 1920x1080. */
  hairline: number
  fontFamily: string
  transition: 'fade' | 'cut'
}
