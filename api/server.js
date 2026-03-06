const express = require("express")
const multer = require("multer")
const { Client } = require("pg")
const Minio = require("minio")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } })

const db = new Client({
  host: "postgres",
  user: "admin",
  password: "admin123",
  database: "usersdb",
  port: 5432
})

db.connect()

db.query(`
CREATE TABLE IF NOT EXISTS users(
id SERIAL PRIMARY KEY,
name TEXT,
email TEXT,
photo TEXT
)
`)

const minioClient = new Minio.Client({
  endPoint: "minio",
  port: 9000,
  useSSL: false,
  accessKey: "minioadmin",
  secretKey: "minioadmin"
})

const bucket = "uploads"

minioClient.bucketExists(bucket, (err) => {
  if (err) {
    minioClient.makeBucket(bucket)
  }
})

app.post("/users", upload.single("photo"), async (req,res)=>{

  const {name,email} = req.body
  const file = req.file

  const filename = Date.now()+"-"+file.originalname

  await minioClient.putObject(bucket, filename, file.buffer)

  const url = `http://192.168.0.101:9000/${bucket}/${filename}`

  const result = await db.query(
    "INSERT INTO users(name,email,photo) VALUES($1,$2,$3) RETURNING *",
    [name,email,url]
  )

  res.json(result.rows[0])
})

app.get("/users", async(req,res)=>{
  const result = await db.query("SELECT * FROM users")
  res.json(result.rows)
})

app.delete("/users/:id", async(req,res)=>{
  await db.query("DELETE FROM users WHERE id=$1",[req.params.id])
  res.json({message:"deleted"})
})

app.listen(8080,()=>{
console.log("API running on 8080")
})
