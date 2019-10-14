#!/usr/bin/env node
const argv = require('yargs').argv;
const open = require('open');
const express = require('express')
const path = require('path');

if (argv._.length !== 2) {
    console.error(`Expecting 2 file paths. Found: ${argv._.length}`);
    process.exit(1);
}

const app = express();

const port = argv.port || 8042;

const path0 = path.parse(path.resolve(__dirname, argv._[0]));
const path1 = path.parse(path.resolve(__dirname, argv._[1]));

app.get('/', (req, res) => res.sendFile("./dist/index.html", { root: __dirname }));
app.get('/video1.mp4', (req, res) => res.sendFile(path0.base, { root: path0.dir }));
app.get('/video2.mp4', (req, res) => res.sendFile(path1.base, { root: path1.dir }));

if (argv._.length > 2) {
    const srtPath = path.parse(path.resolve(__dirname, argv._[2]));
    app.get('/subtitles.srt', (req, res) => res.sendFile(srtPath.base, {root: srtPath.dir}));
}

app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
    open(`http://0.0.0.0:${port}`);
});