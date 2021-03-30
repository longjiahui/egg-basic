exports.LoginCheckError = class extends Error{
    constructor(...messages){
        super()
        let message = ''
        for(let m of messages){
            if(m && typeof m === 'object'){
                m = JSON.stringify(m)
            }
            if(message){
                message += ' @@ '
            }
            message += `${m}`
        }
        this.message = message
        this.name = 'loginCheckError'
    }
}