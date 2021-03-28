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

    async pageData(options){
        let {
            model, 
            queryHandler = query=>query,
            dataHandler = data=>data,
            condition = {},
            projection,
        } = options || {}
        let ctx = this.ctx
        let {
            page,
            pageSize
        } = ctx.request.body || {}

        page = page?+page:1
        pageSize = pageSize?+pageSize:20
        let datas = await (queryHandler(model.find(condition, projection, {
            limit: pageSize,
            skip: (page-1) * pageSize
        })).exec())
        let total = await model.count(condition)
        return this.success({
            data: (dataHandler?(await dataHandler?.(datas)):datas) || [],
            total
        })
    }

    async save(options){
        let {
            model,
            dataHandler = data=>data,
            dataHandlerWhenUpdate = data=>data,
            dataHandlerWhenSave = data=>data,
            // e.g.: '-password' / 'test testa testb'
            fields = null,
        } = options || {}
        let ctx = this.ctx
        
        let data = ctx.request.body
        if(fields){
            fields = fields.trim()
            let items = fields.split(' ')
            if(fields?.[0] === '-'){
                items.forEach(i=>{
                    delete data[i.slice(1)]
                })
            }else{
                data = items.reduce((t, i)=>{
                    if(data.hasOwnProperty(i)){
                        t[i] = data[i]
                    }
                    return t
                }, {})
            }
        }
        data = dataHandler(data)
        if(data._id){
            let _id = data._id
            delete data._id
            data = dataHandlerWhenUpdate(data)
            return this.success(await model.findByIdAndUpdate(_id, data, {new: true}))
        }else{
            data = dataHandlerWhenSave(data)
            return this.success(await model.create(data))
        }
    }
}