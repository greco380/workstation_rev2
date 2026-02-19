export const IPC = {
  AI: {
    SUBMIT_PROMPT: 'ai:submit-prompt',
    GET_MODELS: 'ai:get-models',
    SWITCH_MODEL: 'ai:switch-model',
    GET_CONVERSATIONS: 'ai:get-conversations',
    SET_API_KEY: 'ai:set-api-key',
    GET_API_KEY_STATUS: 'ai:get-api-key-status'
  },
  GAME: {
    SAVE: 'game:save',
    LOAD: 'game:load'
  }
} as const
