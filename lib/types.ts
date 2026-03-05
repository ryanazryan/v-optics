export type HUDSettings = {
  brightness: number
  language: "id" | "en"
  notifications: boolean
  navigation: boolean
  translation: boolean
  healthMonitor: boolean
  objectDetect: boolean
  voiceControl: boolean
  nightMode: boolean
  accentColor: string  
  hideUI: boolean    
}

export const defaultSettings: HUDSettings = {
  brightness: 80,
  language: "id",
  notifications: true,
  navigation: true,
  translation: true,
  healthMonitor: true,
  objectDetect: true,
  voiceControl: true,
  nightMode: false,
  accentColor: "#00ffff",
  hideUI: false,
}