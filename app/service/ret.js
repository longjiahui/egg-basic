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

            // 互斥 只有一个生效
            withDeleted = false,
            onlyDeleted = false,
            
        } = options || {}
        let ctx = this.ctx
        let {
            page,
            pageSize
        } = ctx.request.body || {}

        page = page?+page:1
        pageSize = pageSize?+pageSize:20

        let findFunc = model?.find, countDocumentsFunc = model?.countDocuments
        if(withDeleted){
            findFunc = model?.findWithDeleted
            countDocumentsFunc = modal?.countDocumentsWithDeleted
        }
        if(onlyDeleted){
            findFunc = model?.findDeleted
            countDocumentsFunc = model?.countDocumentsDeleted
        }

        // 必须指定model为this
        let datas = await (queryHandler(findFunc?.call(model, condition, projection, {
            limit: pageSize,
            skip: (page-1) * pageSize
        }))?.exec())

        let total = await countDocumentsFunc?.call(model, condition)
        return this.makePageData(total, 
            (dataHandler?(await dataHandler?.(datas)):datas) || [],)
    }

    makePageData(total, data){
        return this.success({
            data,
            total
        })
    }

    emptyPageData(){
        return this.makePageData(0, [])
    }

    async save(options){
        let {
            model,
            dataHandler = data=>data,
            dataHandlerWhenUpdate = data=>data,
            dataHandlerWhenSave = data=>data,
            session,
            // e.g.: '-password' / 'test testa testb'
            fields = null,
        } = options || {}
        let ctx = this.ctx
        
        let data = ctx.request.body
        let { _id } = data
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
        if(_id){
            data = dataHandlerWhenUpdate(data)
            return this.success(await model.findByIdAndUpdate(_id, data, {
                session,
                new: true
            }))
        }else{
            data = dataHandlerWhenSave(data)
            return this.success((await model.create([data], { session }))?.[0])
        }
    }
}