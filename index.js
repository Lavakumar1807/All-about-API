const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./firestore');
require('dotenv').config();

const app = express()
app.use(express.json())

// Verification middleware
app.use(async(req,res,next)=>{
    if(req.path=='/login' || req.path=="/signup"){
        req.users=null
        next()
        return
    }
    try{
      const token = req.headers.token
      const payload = jwt.verify(token,process.env.KEY)
      req.userid = payload.id
      next()
    }
    catch(error){
        res.status(401).send({message:"Invalid token"})
    }
})

const PORT =  3000;
const studentCollection = db.collection("students");

app.get('/',(req,res)=>{
    res.send("Welcome to STUDENT MANAGEMENT SYSTEM ( SMS )")
})

app.post('/signup',async(req,res)=>{
    try{
    const { name,password,age,rollnumber,branch} = req.body
    if(!name || !age || !rollnumber || !branch || !password){
        res.status(400).send("name,age,branch,rollnumber,password are required")
        return;
    }
    else{
    const newstudent = await studentCollection.add({
         name:name,
         password:password,
         age:age,
         rollnumber:rollnumber,
         branch:branch,
         hobbies:[]
    })
    res.status(200).json({ id : newstudent.id})
    }}
    catch(error){
        console.log("ERROR : ",error)
        res.status(500).send(error)
    }
})

app.post("/login",async(req,res)=>{
    const {id,password} = req.body;
    const student = await studentCollection.doc(id).get()

    if(password === student.get("password")){
       const token = jwt.sign({id:id},process.env.KEY);
       res.status(200).json({token:token})
    }else{
        res.status(401).send("Wrong password");
    }
})

app.get('/students/:id',async(req,res)=>{
    const {id} = req.params

    if(id === req.userid){
        const student = await studentCollection.doc(req.params.id).get()
        res.send(student.data());
    }
    else{
        res.status(401).send("You can't view other students data");
    }
})

app.put('/students/:id',async(req,res)=>{
    const {name,age,rollnumber,branch}= req.body
    if(!name || !age || !rollnumber || !branch ){
        res.status(400).send("name,age,rollnumber,password,branch are required")
    }
    else{
     if(req.params.id === req.userid){
       const student = await studentCollection.doc(req.params.id).get()
       if(!student.exists){
         res.status(404).send("Student not found")
       }
      else{
         const updateddata = await studentCollection.doc(req.params.id).update({
            name:name,
            age:age,
            rollnumber:rollnumber,
            branch:branch
        })
         res.status(201).send("Student updated");
      }
    }
    }
})

app.delete('/students/:id',async(req,res)=>{
    const id = req.params.id
    if( id === req.userid){
        const student = await studentCollection.doc(req.params.id).delete()
        if(!student){
           res.status(404).send("Student not found")
        }
        else{
           res.status(200).send("Student deleted")
        }
    }
    else{
        res.status(400).send("You can't delete other students data")
    }
})

// Hobbies 

app.get("/students/:id/hobbies",async(req,res)=>{
    const id = req.params.id
    const student = await studentCollection.doc(id).get()

    if(id === req.userid ){
      if(!student.exists){
        res.status(404).send("Student not found")
     }
      else{
        res.status(200).send(student.data().hobbies)
     }
    }
    else{
        res.status(400).send("You can't get other students data")
    }
})

app.post("/students/:id/hobbies",async(req,res)=>{
    const id = req.params.id
    const student = await studentCollection.doc(id).get()
    if(id === req.userid){
       if(!student.exists){
         res.status(404).send("Student not found")
       }
       else{
        let oldhobbies = student.get("hobbies")
        let newhobbies = [...oldhobbies,req.body.hobbies]
        await studentCollection.doc(req.params.id).update({
            hobbies:newhobbies
        })
        res.send("Hobby added")
       }
    }
    else{
        res.status(400).send("You can't access other students data");
    }
})

// Use for checking 

app.get('/students',async(req,res)=>{
    const students = await studentCollection.get()
    const studentdoc = []

    if(students.empty){
        res.status(404).send("No student found !")
    }
    else{
       students.forEach(doc =>{
           studentdoc.push({id:doc.id,...doc.data()})
       })
       res.status(200).send(studentdoc)
    }
})

app.listen(PORT,(req,res)=>{
    console.log("Running on PORT :",PORT);
})