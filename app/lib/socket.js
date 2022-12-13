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
    to(channel){
        return {
            emit: (command, ...rest)=>{
                this.pub.publish(channel, utils.serializeRedisPSMessage(command, ...rest))
            }
        }
    }
}