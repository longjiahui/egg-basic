module.exports = app=>class extends app.Service{
    constructor(...rest){
        super(...rest)
        this._errno = -100
    }

    /**
     *  index
     *  service- 100-200
     *  global- 200-n
     *  controller- 0-100
     */
    error(index, message){
        return {
            code: this._errno - index,
            msg: message
        }
    }

    success(data, code = 0){
        return {
            code,
            data
        }
    }

    async pageData(...rest){
        return this.success(await this.ctx.service.basic.pageData(...rest))
    }

    makePageData(...rest){
        return this.success(this.ctx.service.basic.makePageData(...rest))
    }

    emptyPageData(){
        return this.makePageData(0, [])
    }

    async save(...rest){
        return this.success(await this.ctx.service.basic.save(...rest))
    }

    async pageDataByAggregate(...rest){
        return this.success(await this.ctx.service.basic.pageDataByAggregate(...rest))
    }
}