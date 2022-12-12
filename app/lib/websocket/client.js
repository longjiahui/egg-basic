const Emitter = require('./emitter')
const shortid = require('shortid')
const Redis = require('ioredis')
const Socket = require('../socket')
const utils = require('../utils')

const SUB = Symbol('Client#sub')
const SOCKET = Symbol('Client#Socket')

module.exports = app=>class extends Emitter{

    pub = new Redis(app.config.redis)
    sub = new Redis(app.config.redis)

    // client: 'ws' connection
    constructor(client, commandTimeout=15000){
        super()
        this.id = shortid.generate()    // 唯一标识
        this.client = client
        this.commandTimeout = commandTimeout
        if(!this.client){
            throw new Error(`construct Client error: ${this.client}`)
        }
        client.on('close', (...rest)=>{
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
    
    get sub(){
        if(!this[SUB]){
            this[SUB] = new Redis(app.config.redis)
        }
        return this[SUB]
    }

    messageHandler(data){
        data = String(data)
        this.debug('received: ', data.slice(0, 1024))
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
        this.debug('sending: ', data && data.slice(0, 1024))
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

    join(room){
        return new Promise((r, reject)=>{
            this.sub.subscribe(utils._roomKey(room), (err, count)=>{
                if (err) {
                    reject(err)
                } else {
                    r(count)
                }
            })
            this.sub.on('message', (channel, message)=>{
                app.logger.debug(`receive message from channel[${channel}]: ${message?.slice?.(100)}`)
                this.send(...utils.deserializeRedisPSMessage(message))
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