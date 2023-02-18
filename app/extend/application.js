const jwt = require('jsonwebtoken')
const SOCKET = Symbol('Context#socket')
const Socket = require('../lib/socket')
const errorType = require('../lib/errorType')

module.exports = {
    ...errorType,
    
    get jwt(){
        return jwt
    },
    get socket(){
        if(!this[SOCKET]){
            this[SOCKET] = new (Socket(this))()
        }
        return this[SOCKET]
    },
}