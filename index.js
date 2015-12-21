var temp = require('temp')
var fs = require('fs')
var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs')
var binPath = phantomjs.path
var express = require('express')
var morgan = require('morgan')
var pkg = require('./package.json')

var app = express();

temp.track()
app.use(morgan('combined', {stream: process.stdout}))

app.get('/fire.png', function (req, res) {
  if(!req.query.url) {
    return res.status(404).send("Not Found");
  }

  var width = parseInt(req.query.width) || 1280;
  var height = parseInt(req.query.height) || 800;

  temp.open({prefix: "scrgun", suffix: ".png"}, function(err, info) {
    if (err) {
      return res.status(500).send("Internal Server Error");
    }

    var dst = info.path;

    var childArgs = [
      path.join(__dirname, 'workers', 'shot_maker.js'),
      req.query.url,
      dst, "1280px*700px"
    ]

    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
      if(err) {
        return res.status(500).send("Internal Server Error");
      }

      res.sendFile(dst, function( ) {
        fs.close(info.fd);
      })
    })
  })
})

app.get("/stats.json", function(req, res) {
  res.json({
    last_cleanup: app.get("stats:last_cleanup"),
    temp: app.get("stats:temp"),
    memory: process.memoryUsage(),
    version: pkg.version,
    backend_port: server.address().port
  })
})

setInterval(function() {
  temp.cleanup(function(err, stats) {
    app.set("stats:temp", stats)
    app.set("stats:last_cleanup", new Date())
  })
}, 30e3)

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('screengun is listening at http://%s:%s', host, port)
})


