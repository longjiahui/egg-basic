const jwt = require('jsonwebtoken')

module.exports = {
    get jwt(){
        return jwt
    },
    jwtSign(target, ...rest){
        return jwt.sign(target, this.config.jwtSecret, ...rest)
    }
}