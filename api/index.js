app.post("/login", (req, res) => {

const {username, password} = req.body;

if(username === "admin" && password === "admin123"){
    res.json({success:true, token:"admin-token"});
}else{
    res.status(401).json({success:false});
}

});
