const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const bodyParser = require('body-parser')
const { Client } = require('pg')
const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://rshfeczvrlrapg:ad2d64520322decff1e2fd7b46ba323fe0b71add82638bc3bc5d9bbebc0b2f63@ec2-54-204-43-7.compute-1.amazonaws.com:5432/dc5lesh6qum9mc',
    ssl: true
})

app.use(bodyParser.urlencoded({ extended: true }))

app.listen(port, () => {
    console.log(`Server is running at port ${port}`)
})

app.get('/', (request, response) => {
    response.write('<h1>This is the dev Nestr backend</h1>')
    response.write('<h2>This is the dev Nestr backend</h2>')
    response.write('<p>This is the dev Nestr backend</p>')
    response.write('<p>Here we are building our web API</p>')
    response.end()
})

client.connect();

app.get('/api/nests', (request, response) => {
    client.query('SELECT * FROM nest', (err, res) => {
        if (err)
            console.log(err)
        else
            response.json(res.rows)
    })
})

app.get('/api/nests/:id', (request, response) => {
    const text = 'SELECT * FROM nest WHERE id=$1'
    const values = [request.params.id]

    client.query(text, values, (err, res) => {
        if (err)
            console.log(err)
        else
            response.json(res.rows)
    })
})

app.post('/api/nests', (request, response) => {
    const text = 'INSERT INTO nest(id, name, lat, lng) VALUES($1, $2, $3, $4)'
    const values = [request.body.id, request.body.name, request.body.lat, request.body.lng]

    client.query(text, values, (err, res) => {
        if (err) {
            console.log(err.stack)
        } else {
            response.json('Added to db')
        }
    })
})

app.put('/api/nests', (request, response) => {
    const text = 'UPDATE nest SET name=$2, lat=$3, lng=$4  WHERE id=$1'
    const values = [request.body.id, request.body.name, request.body.lat, request.body.lng]

    client.query(text, values, (err, res) => {
        if (err) {
            console.log(err.stack)
        } else {
            response.json('DB updated')
        }
    })
})