const { ValidateError } = require('@anfo/egg-anfo-validator/app/lib/errorType')

class LoginCheckError extends Error{
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

let DefaultError = class extends Error{
    constructor(no, msg, ...rest){
        super(`${no}: ${msg}`, ...rest)
        this.no = no
        this.msg = msg
    }
}
let ServiceError = class extends DefaultError{
    constructor(no, msg, ...rest){
        super(no, msg, ...rest)
    }
}
let errors = {
    ValidateError,
    LoginCheckError,
    
    Error: DefaultError, 
    ServiceError,
}
module.exports = errors