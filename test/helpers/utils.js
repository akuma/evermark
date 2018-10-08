/**
 * Some helper functions for testing.
 */

function randomString() {
  return Math.random()
    .toString(36)
    .substring(7)
}

module.exports = {
  randomString
}
