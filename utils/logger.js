const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class Logger {
  static getTimestamp() {
    return new Date().toISOString();
  }

  static formatMessage(type, message, color) {
    const timestamp = this.getTimestamp();
    return `${color}[${type}]${colors.reset} ${timestamp} - ${message}`;
  }

  static log(type, message, color = colors.reset) {
    console.log(this.formatMessage(type, message, color));
  }

  static fetch(message) {
    this.log('FETCH', message, colors.blue);
  }

  static parse(message) {
    this.log('PARSE', message, colors.cyan);
  }

  static store(message) {
    this.log('STORE', message, colors.green);
  }

  static expire(message) {
    this.log('EXPIRE', message, colors.yellow);
  }

  static api(message) {
    this.log('API', message, colors.magenta);
  }

  static error(message, error = null) {
    const errorMsg = error ? `${message}: ${error.message || error}` : message;
    this.log('ERROR', errorMsg, colors.red);
    if (error && error.stack) {
      console.error(error.stack);
    }
  }

  static info(message) {
    this.log('INFO', message, colors.bright);
  }
}

module.exports = Logger;

