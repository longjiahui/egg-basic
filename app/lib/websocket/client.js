const Emitter = require('./emitter')
const shortid = require('shortid')
const Redis = require('ioredis')
const Socket = require('../socket')
const utils = require('../utils')

const ROOMSUB = Symbol('Client#roomSub')
const SOCKET = Symbol('Client#Socket')

module.exports = app=>class extends Emitter{

    pub = new Redis(app.config.redis)
    userSub = new Redis(app.config.redis)

    // client: 'ws' connection
    constructor(client, userID, commandTimeout=15000){
        super()
        this.id = shortid.generate()    // 唯一标识
        this.userID = userID
        this.client = client
        this.commandTimeout = commandTimeout
        if(!this.client){
            throw new Error(`construct Client error: ${this.client}`)
        }
        if(userID){
            this.userSub.subscribe(userID, err=>{
                if (err) {
                    app.logger.error(`${userID} subscribe failed: `, err)
                }else{
                    this.userSub.on('message', (channel, message)=>{
                        if(channel === String(userID)){
                            this.send(...utils.deserializeRedisPSMessage(message))
                        }
                    })
                }
            })
        }
        client.on('close', (...rest)=>{
            this.roomSub.unsubscribe()
            this.userSub.unsubscribe()
            this.emit('close', ...rest)
        })
        client.on('message', (...rest)=>this.messageHandler(...rest))
    }

    get socket(){
        if(!this[SOCKET]){
            this[SOCKET] = Socket(app)
        }
        return this[SOCKET]
    }

    to(...rest){
        return this.socket.to(...rest)
    }
    
    get roomSub(){
        if(!this[ROOMSUB]){
            this[ROOMSUB] = new Redis(app.config.redis)
        }
        return this[ROOMSUB]
    }

    messageHandler(data){
        data = String(data)
        this.debug('received: ', data.slice(0, 50))
        try{
            data = JSON.parse(data)
        }catch(err){
            this.error('message format error: ', err)
            return
        }
        let command = data && data.command
        if(command){
            this.emit(command, ...(data.data || [])).then(ret=>{
                if(data.replyId){
                    return this.reply(data.replyId, ret)
                }
            })
        }
    }

    async _send(data){
        data = JSON.stringify(data)
        this.debug('sending: ', data && data.slice(0, 50))
        this.client.send(data)
    }

    // 只返回一个参数data，而不是...rest 因为promise resolve只能是一个参数
    async reply(replyId, data){
        return this._send({
            command: replyId,
            data: [data]
        })
    }

    send(command, ...rest){
        let promise = new Promise((r, reject)=>{
            // 此id用来绑定 返回的消息是属于该发送的返回
            let replyId = shortid.generate()
            this.once(replyId, r)
            this._send({
                replyId,
                command,
                data: rest,
            })
            setTimeout(()=>{
                promise.catch(err=>{
                    this.error(err)
                })
                let errInfo = `[${Date.now()}]command(${command}) request timeout: ${this.commandTimeout}ms`
                reject(errInfo)
            }, this.commandTimeout)
        })
        return promise
    }

    join(roomChannel){
        return new Promise(async (r, reject)=>{
            await this.roomSub.unsubscribe()
            this.roomSub.removeAllListeners('message')
            this.roomSub.subscribe(roomChannel, (err, count)=>{
                if (err) {
                    reject(err)
                } else {
                    r(count)
                }
            })
            this.roomSub.on('message', (channel, message)=>{
                if(String(roomChannel) === channel){
                    this.send(...utils.deserializeRedisPSMessage(message))
                }
            })
        })
    }

    close(){
        this.client.close()
    }

    _log(level, ...rest){
        return app.logger[level](...rest)
    }
    log(...rest){
        return this._log('log', ...rest)
    }
    error(...rest){
        return this._log('error', ...rest)
    }
    debug(...rest){
        return this._log('debug', ...rest)
    }
    warn(...rest){
        return this._log('warn', ...rest)
    }
}