const express = require('express')
const app = express()
const port = process.env.PORT || 5000

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