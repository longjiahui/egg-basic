module.exports = app=>class extends app.Service{
    getPageProps(){
        let ctx = this.ctx
        let {
            page,
            pageSize
        } = ctx.request.body || {}

        page = page?+page:1
        pageSize = pageSize?+pageSize:20
        return {
            page,
            pageSize,
        }
    }

    getLimitAndSkip(){
        let { page, pageSize } = this.getPageProps()
        return {
            limit: pageSize,
            skip: (page-1) * pageSize,
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
        let datas = await (queryHandler(findFunc?.call(model, condition, projection, this.getLimitAndSkip()))?.exec())
        let total = await countDocumentsFunc?.call(model, condition)
        return this.makePageData(total, 
            (dataHandler?(await dataHandler?.(datas)):datas) || [],)
    }

    makePageData(total, data){
        return {
            data,
            total
        }
    }

    emptyPageData(){
        return this.makePageData(0, [])
    }

    filterData(data, fields = ''){
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
        return data
    }

    async save(options){
        let {
            model,
            dataHandler = data=>data,
            dataHandlerWhenUpdate = data=>({$set: data}),
            dataHandlerWhenSave = data=>data,
            session,
            projection,
            // e.g.: '-password' / 'test testa testb'
            fields = null,
            upsert = false,

            data,
        } = options || {}
        let ctx = this.ctx
        
        data = data || ctx.request.body
        let { _id } = data
        data = this.filterData(data, fields)
        data = dataHandler(data)
        if(_id){
            data = dataHandlerWhenUpdate(data)
            return await model.findByIdAndUpdate(_id, data, {
                session,
                new: true,
                upsert,
                projection,
            })
        }else{
            data = dataHandlerWhenSave(data)
            return this.filterData((await (new model(data)).save({session}))?.toObject?.() || {}, projection)
        }
    }

    async pageDataByAggregate(options){
        let {
            pipeline = [],
            // withDelete or not
            type = '',
            model,
            sortPipeline = [],
            suffixPipeline = [],
            dataHandler = d=>d,
        } = options || {}
        let { skip, limit } = this.getLimitAndSkip()
        let data = (await model[`aggregate${type}`]([
            ...pipeline,
            {
                $facet: {
                    data: [...sortPipeline, {
                            $skip: skip,
                        }, {
                            $limit: limit,
                        },
                        ...suffixPipeline,
                    ],
                    amount: [{
                        $count: 'amount',
                    }]
                }
            }
        ]))[0]
        return this.makePageData(data.amount?.[0]?.amount || 0, (dataHandler ? (await dataHandler(data.data)) : data.data) || [])
    }
}