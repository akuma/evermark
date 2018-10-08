class EvermarkError extends Error {
  constructor(message) {
    super(message)
    this.name = 'EvermarkError'
  }
}

module.exports = EvermarkError
