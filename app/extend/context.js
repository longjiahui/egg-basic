const SOCKET = Symbol('Context#socket')
const ClientMaker = require('../lib/websocket/client')

module.exports = {
    getParamsString(){
        let ctx = this
        let paramsString = ''
        let { query, body, params } = ctx.request
        if(query && Object.keys(query).length > 0){
            paramsString += `query: ${JSON.stringify(query)}\n`
        }
        if(params && Object.keys(params).length > 0){
            paramsString += `params: ${JSON.stringify(params)}`
        }
        if(body){
            if(typeof body === 'object' && Object.keys(body).length > 0
            || typeof body !== 'object'){
                paramsString += `body: ${JSON.stringify(body)}`
            }
        }
        return paramsString
    },
    getParamsValueString(){
        let ctx = this
        let paramsString = ''
        let { query, body, params } = ctx.request
        if(query && Object.keys(query).length > 0){
            paramsString += `query: ${Object.values(query).join(' ')}\n`
        }
        if(params && Object.keys(params).length > 0){
            paramsString += `params: ${Object.values(params).join(' ')}`
        }
        if(body){
            if(typeof body === 'object' && Object.keys(body).length > 0){
                paramsString += `body: ${Object.values(body).join(' ')}`
            }
            if(typeof body !== 'object'){
                paramsString += `body: ${JSON.stringify(body)}`
            }
        }
        return paramsString
    },
    get socket(){
        if(!this[SOCKET]){
            this[SOCKET] = new (ClientMaker(this.app))(this.websocket)
        }
        return this[SOCKET]
    },
}