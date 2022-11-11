const errorType = require('../lib/errorType')
const JWT = require('jsonwebtoken')

// check true token需要存在且合法，否则报未登录错误
// check false token可以不存在且可以不合法，不报错
module.exports = (type, isQuiet=false)=>(async (ctx, next)=>{
    let token = ctx.request.header?.authorization || ctx.cookies.get(`${type}Token`) || ctx.cookies.get('token')
    if(!isQuiet && !token){
        throw new errorType.LoginCheckError('token not found')
    }else if(token){
        try{
            let data = JWT.verify(token, ctx.app.config.jwtSecret?.[type])
            ctx.state.user = data
        }catch(err){
            ctx.logger.warn(err)
            if(!isQuiet){
                throw new errorType.LoginCheckError('token verify error', err)
            }
        }
    }
    await next()
})