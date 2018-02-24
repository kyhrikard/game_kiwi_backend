const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { Client } = require('pg')
const app = express()
const port = process.env.PORT || 5000
const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://rshfeczvrlrapg:ad2d64520322decff1e2fd7b46ba323fe0b71add82638bc3bc5d9bbebc0b2f63@ec2-54-204-43-7.compute-1.amazonaws.com:5432/dc5lesh6qum9mc',
    ssl: true
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

app.listen(port, () => {
    console.log(`Server is running at port ${port}`)
})

app.get('/', (request, response) => {
    response.write('<h1>Availiable endpoints at the Nestr Dev Backend</h1>')
    app._router.stack.forEach(function (r) {
        if (typeof r.route != 'undefined') {
            if (r.route.path !== '/') {
                response.write(`<h2>${r.route.path} -- ${r.route.stack[0].method}</h2>`)
            }
        }
    })
    response.end()
})

client.connect();

// Get all nests and which team owns it
app.get('/api/nests', (request, response) => {
    const text = `
    SELECT id, nest.name as name, latitude, longitude, result.name as inhabitedby, result.username as latestsnatcher, result.timestamp as snatchtimestamp
    FROM nest
    LEFT OUTER JOIN
        (SELECT DISTINCT ON (nestid) nestid, timestamp, name, player.username
	    FROM playertimestampnest, player, team
	    WHERE playertimestampnest.playerid = player.id
	    AND player.teamid = team.id
	    ORDER BY nestid, timestamp DESC) AS result
    ON nest.id = result.nestid
    ORDER BY id DESC`

    client.query(text, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        }
        else
            response.json(res.rows)
    })
})

// Get nest
app.get('/api/nests/:id', (request, response) => {
    const text = `
    SELECT id, nest.name as name, latitude, longitude, result.name as inhabitedby, result.username as latestsnatcher, result.timestamp as snatchtimestamp
    FROM nest
    LEFT OUTER JOIN
        (SELECT DISTINCT ON (nestid) nestid, timestamp, name, player.username
	    FROM playertimestampnest, player, team
	    WHERE playertimestampnest.playerid = player.id
	    AND player.teamid = team.id
	    ORDER BY nestid, timestamp DESC) AS result
    ON nest.id = result.nestid
    WHERE id = $1
    ORDER BY id DESC`

    const values = [request.params.id]

    client.query(text, values, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        }
        else
            response.json(res.rows)
    })
})

// Create nest
app.post('/api/nests', (request, response) => {
    const text = `
        INSERT INTO nest(name, latitude, longitude) 
        VALUES($1, $2, $3)`

    const values = [request.body.name, request.body.latitude, request.body.longitude]

    client.query(text, values, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        } else {
            response.status(200)
            response.json('Nest created')
        }
    })
})

// Update nest
app.put('/api/nests/:id', (request, response) => {
    const text = `
        UPDATE nest 
        SET name = COALESCE($2, name), 
        latitude = COALESCE($3, latitude), 
        longitude = COALESCE($4, longitude) 
        WHERE id=$1`

    const values = [request.params.id, request.body.name, request.body.latitude, request.body.longitude]

    // Check if request is empty
    let emptyRequest = true

    for (let index = 1; index < values.length; index++) {
        console.log(values[index])
        if (typeof values[index] !== 'undefined')
            emptyRequest = false
    }

    if (emptyRequest) {
        response.status(400)
        response.json('Your request is empty')
    }
    else {
        client.query(text, values, (err, res) => {
            if (err) {
                response.status(400)
                response.json(err.detail)
            } else {
                response.status(200)
                response.json('Nest updated')
            }
        })
    }

})

// Get the players and their current score
app.get('/api/players', (request, response) => {
    const text = `
    SELECT result2.id, result2.username, result2.password, result2.email, team.name as teamname, result2.totalneststaken
    FROM team, 
	(SELECT player.id, player.username, player.password, player.email, player.teamid, result.totalneststaken
	FROM player
	LEFT OUTER JOIN
		(SELECT p.id, p.username, t.name as team, COUNT(*) as totalneststaken 
     	FROM playertimestampnest ptsn, player p, team t 
     	WHERE ptsn.playerid = p.id 
     	AND p.teamid = t.id
     	GROUP BY (p.username, t.name, p.id)
     	ORDER BY totalneststaken DESC) AS result
	ON player.id = result.id) AS result2
    WHERE team.id = result2.teamid`

    client.query(text, (err, res) => {
        if (err) {
            response.status(400)
            response.json('Error getting players')
        }
        else {
            response.status(200)
            response.json(res.rows)
        }
    })
})

// Get a player with the current score
app.get('/api/players/:id', (request, response) => {
    const text = `
    SELECT result2.id, result2.username, result2.password, result2.email, team.name as teamname, result2.totalneststaken
    FROM team, 
	(SELECT player.id, player.username, player.password, player.email, player.teamid, result.totalneststaken
	FROM player
	LEFT OUTER JOIN
		(SELECT p.id, p.username, t.name as team, COUNT(*) as totalneststaken 
     	FROM playertimestampnest ptsn, player p, team t 
     	WHERE ptsn.playerid = p.id 
     	AND p.teamid = t.id
     	GROUP BY (p.username, t.name, p.id)
     	ORDER BY totalneststaken DESC) AS result
	ON player.id = result.id) AS result2
    WHERE team.id = result2.teamid
    AND result2.id = $1`

    const values = [request.params.id]

    client.query(text, values, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        }
        else
            response.json(res.rows)
    })
})

// Create player
app.post('/api/players', (request, response) => {
    const text = `
        INSERT INTO player(username, password, teamid, email) 
        VALUES($1, $2, $3, $4)`

    const values = [request.body.username, request.body.password, request.body.teamid, request.body.email]

    //Check if request contains empty fields
    let emptyRequestFields = false

    for (let index = 0; index < values.length; index++) {
        console.log(values[index])
        if (typeof values[index] === 'undefined')
            emptyRequestFields = true
    }

    if (emptyRequestFields) {
        response.status(400)
        response.json('Your request contains empty fields')
    }
    else {
        client.query(text, values, (err, res) => {
            if (err) {
                response.status(400)
                response.json(err.detail)
            } else {
                response.status(201)
                response.json(`Player ${request.body.username} created`)
            }
        })
    }
})

// Delete a player
app.delete('/api/players/:id', (request, response) => {
    const text = `
        DELETE FROM player 
        WHERE id=$1`

    const values = [request.params.id]

    client.query(text, values, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        }
        else
            response.json(res.rows)
    })
})

// Get the top nest snatchers
app.get('/api/topplayers', (request, response) => {
    const text =`
        SELECT p.id, p.username, t.name as team, COUNT(*) as totalneststaken 
        FROM playertimestampnest ptsn, player p, team t 
        WHERE ptsn.playerid = p.id 
        AND p.teamid = t.id
        GROUP BY (p.username, t.name, p.id)
        ORDER BY totalneststaken DESC`

    client.query(text, (err, res) => {
        if (err) {
            response.status(400)
            response.json('Error getting timestamps')
        }
        else {
            response.status(200)
            response.json(res.rows)
        }
    })
})

// Get the current amount of nest owned right now
app.get('/api/currentteamscore', (request, response) => {
    const text =`
        SELECT name, COUNT(name) as currentscore
        FROM
            (SELECT DISTINCT ON (nestid) nestid, timestamp, name
            FROM playertimestampnest, player, team
            WHERE playertimestampnest.playerid = player.id
            AND player.teamid = team.id
            ORDER BY nestid, timestamp DESC) AS result
        GROUP BY name`

    client.query(text, (err, res) => {
        if (err) {
            response.status(400)
            response.json('Error getting score')
        }
        else {
            response.status(200)
            response.json(res.rows)
        }
    })
})

// Add timestamp
app.post('/api/playertimestampnests', (request, response) => {
    const text =`
    INSERT INTO playertimestampnest(playerid, nestid, timestamp)
    VALUES ($1, $2, $3)`

    const values = [request.body.playerid, request.body.nestid, request.body.timestamp]

    client.query(text, values, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        } else {
            response.status(201)
            response.json(`Timestamp added`)
        }
    })
})

// Get the timestamps
app.get('/api/playertimestampnests', (request, response) => {
    const text = `
    SELECT *
    FROM playertimestampnest
    ORDER BY timestamp DESC`

    client.query(text, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        }
        else
            response.json(res.rows)
    })
})

// Get the latest timestamp
app.get('/api/playertimestampnests/latest', (request, response) => {
    const text = `
    SELECT timestamp
    FROM playertimestampnest
    ORDER BY timestamp DESC
    LIMIT 1`

    client.query(text, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        }
        else
            response.json(res.rows)
    })
})

// Get the snatch history
app.get('/api/snatchhistory', (request, response) => {
    const text = `
    SELECT username, nest.name as nestname, timestamp, team.name as teamname
    FROM playertimestampnest, player, nest, team    
    WHERE playertimestampnest.playerid = player.id
    AND playertimestampnest.nestid = nest.id
    AND player.teamid = team.id
    ORDER BY timestamp DESC`

    client.query(text, (err, res) => {
        if (err) {
            response.status(400)
            response.json(err.detail)
        }
        else
            response.json(res.rows)
    })
})



