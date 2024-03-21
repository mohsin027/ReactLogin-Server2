const mongoose=require('mongoose')

function dbConnect(){
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.MONGO_URL).then(()=>{
        console.log("db connected")
    }).catch(err=>{
        console.log(err)
    })
}

module.exports=dbConnect