class AppBootHook {
    constructor(app) {
      this.app = app
    }
  
    configWillLoad() {
      // Ready to call configDidLoad,
      // Config, plugin files are referred,
      // this is the last chance to modify the config.
    }
  
    configDidLoad() {
      // Config, plugin files have been loaded.
        let config = this.app.config
        let jwt = this.app.jwt
        let jwtSecret = config.jwtSecret
        let jwtInjects = Object.keys(jwtSecret || {}).reduce((t, k)=>{
            t[`${k}JWTSign`] = (target, ...rest)=>jwt.sign(target, jwtSecret[k], ...rest)
            t[`${k}JWTVerify`] = (target, ...rest)=>jwt.verify(target, jwtSecret[k], ...rest)
            return t
        }, {})
        Object.assign(this.app, jwtInjects)
    }
  
    async didLoad() {
      // All files have loaded, start plugin here.
    }
  
    async willReady() {
      // All plugins have started, can do some thing before app ready
    }
  
    async didReady() {
      // Worker is ready, can do some things
      // don't need to block the app boot.
    }
  
    async serverDidReady() {
      // Server is listening.
    }
  
    async beforeClose() {
      // Do some thing before app close.
    }
  }
  
  module.exports = AppBootHook