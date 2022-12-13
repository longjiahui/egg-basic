module.exports = {
    serializeRedisPSMessage(command, ...rest){
        return JSON.stringify({
            command, rest
        })
    },

    deserializeRedisPSMessage(message){
        let data = {}
        try{
            data = JSON.parse(message)
        }catch(err){
            app.logger.warn('redis ps message parse failed: ', data)
        }
        return [ data?.command, ...(data?.rest || []), ]
    },
}