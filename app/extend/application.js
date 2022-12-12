const jwt = require('jsonwebtoken')
const SOCKET = Symbol('Context#socket')
const Socket = require('../lib/socket')

module.exports = {
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