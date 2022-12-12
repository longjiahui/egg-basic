const utils = require('./utils')
const Redis = require('ioredis')

const PUB = Symbol('Socket#pub')

module.exports = app=>class{
    get pub(){
        if(!this[PUB]){
            this[PUB] = new Redis(app.config.redis)
        }
        return this[PUB]
    }
    to(room){
        return {
            emit: (command, ...rest)=>{
                this.pub.publish(utils._roomKey(room), utils.serializeRedisPSMessage(command, ...rest))
            }
        }
    }
}