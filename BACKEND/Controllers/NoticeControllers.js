const Notice = require("../Model/NoticeModel");

//Display Data
const getAllNotice = async (req, res, next) => {
    
    let Notices;

    try{
        notices = await Notice.find();
    }catch(err) {
        console.log(err);
    }
    //not found
    if(!notices){
        return res.status(404).json({message:"Notice not found"});
    }

    //Display all Notices
    return res.status(200).json({notices});
};

//Data Insert
const addNotices = async(req, res, next) => {
    
    const {title,notice,attachment,createdBy,category,publishedAt,updatedAt} =  req.body;
    
    let notices;

    try{
        notices = new Notice({title,notice,attachment,createdBy,category,publishedAt,updatedAt});
        await notices.save();
    }catch (err){
        console.log(err);
    }
    //not inserting
    if (!notices){
        return res.status(404).json({massage:"unable to add Notice"});
    }
    return res.status(200).json({notices});
};

//Get by Id(Display data)
const getById = async(req, res, next) => {
    
    const id = req.params.id;

    let notice;

    try{
        notice = await Notice.findById(id);
    }catch (err) {
        console.log(err);
    }
     //not avilable notice inserting
    if (!notice){
        return res.status(404).json({massage:"Notice not found"});
    }
    return res.status(200).json({notice});
}

//Update notice 
const updateNotice = async(req, res, next) => {

    const id = req.params.id;
    const {title,notice,attachment,createdBy,category,publishedAt,updatedAt} =  req.body;

    let notices;

    try{
        notices = await Notice.findByIdAndUpdate(id,
            { 
                title: title, 
                notice: notice, 
                attachment: attachment, 
                createdBy: createdBy, 
                category: category, 
                publishedAt: publishedAt, 
                updatedAt: updatedAt
            });
            notices = await notices.save();
    }catch(err){
        console.log(err);
    }
      //not avilable notice inserting
    if (!notices){
        return res.status(404).json({massage:"Unable to update notice Details"});
    }
    return res.status(200).json({notices});

};

//Delete Notice
const deletenotice = async(req, res, next) => {
    const id = req.params.id;

    let notice;

    try{
        notice = await Notice.findByIdAndDelete(id);
    }catch(err){
        console.log(err)
    }
       //not avilable notice inserting
    if (!notice){
        return res.status(404).json({massage:"Unable to Delete notice Details"});
    }
    return res.status(200).json({notice});

}

exports.getAllNotice = getAllNotice;
exports.addNotice = addNotices;
exports.getById = getById;
exports.updateNotice = updateNotice;
exports.deletenotice = deletenotice;
