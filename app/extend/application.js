const jwt = require('jsonwebtoken')

module.exports = {
    get jwt(){
        return jwt
    },
    jwtSign(target, ...rest){
        return jwt.sign(target, this.config.jwtSecret, ...rest)
    },
    jwtVerify(token, ...rest){
        return jwt.verify(token, this.config.jwtSecret, ...rest)
    },
}