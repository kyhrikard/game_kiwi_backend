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
    response.write('<h1>Availiable endpoints at the Nestr Dev Backend</h1>')
    app._router.stack.forEach(function (r) {
        if (typeof r.route != 'undefined') {
            if (r.route.path !== '/'){
                response.write(`<h1>${r.route.path} -- ${r.route.stack[0].method}</h1>`)
            }
        }
    })
    response.end()
})

client.connect();

// Get all nests
app.get('/api/nests', (request, response) => {
    client.query('SELECT * FROM nest', (err, res) => {
        if (err)
            console.log(err)
        else
            response.json(res.rows)
    })
})

// Get nest
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

// Create nest
app.post('/api/nests', (request, response) => {
    const text = 'INSERT INTO nest(name, latitude, longitude) VALUES($1, $2, $3)'
    const values = [request.body.name, request.body.latitude, request.body.longitude]

    client.query(text, values, (err, res) => {
        if (err) {
            console.log(err.stack)
        } else {
            response.json('Added to db')
        }
    })
})

// Update nest
app.put('/api/nests/:id', (request, response) => {
    const text = 'UPDATE nest SET name = COALESCE($2, name), latitude = COALESCE($3, latitude), longitude = COALESCE($4, longitude) WHERE id=$1'
    const values = [request.params.id, request.body.name, request.body.latitude, request.body.longitude]

    client.query(text, values, (err, res) => {
        if (err) {
            console.log(err.stack)
        } else {
            response.json('DB updated')
        }
    })
})

// Get players
app.get('/api/players', (request, response) => {
    const text = 'SELECT * FROM player'

    client.query(text, (err, res) => {
        if (err)
            console.log(err)
        else
            response.json(res.rows)
    })
})

// Create player
app.post('/api/players', (request, response) => {
    const text = 'INSERT INTO player(username, password, teamid) VALUES($1, $2, $3)'
    const values = [request.body.username, request.body.password, request.body.teamid]

    client.query(text, values, (err, res) => {
        if (err) {
            console.log(err.stack)
        } else {
            response.json('Player created')
        }
    })

})