#!/usr/bin/env node

const yargs = require('yargs');
const open = require('open');
const express = require('express');
const path = require('path');
const fs = require('fs');

const _ = yargs
    .option("start-frame", {
        default: 0,
        type: "number"
    })
    .option("end-frame", {
        default: -1,
        type: "number"
    })
    .command(["serve <video1> <video2> [srt]", "$0"], "Start local server", (yargs) => {
        yargs.option("port", {
            default: 8042,
            type: "number"
        })
    }, (argv) => {

        const app = express();

        const path0 = path.parse(path.resolve(process.cwd(), argv.video1));
        const path1 = path.parse(path.resolve(process.cwd(), argv.video2));

        let html = fs.readFileSync(path.resolve(__dirname, "./dist/index.html")).toString();
        html = html.replace(`startFrame:0`, `startFrame:${argv.startFrame}`)
            .replace(`endFrame:-1`, `endFrame:${argv.endFrame}`);

        app.get('/', (req, res) => res.send(html));
        app.get('/video1.mp4', (req, res) => res.sendFile(path0.base, { root: path0.dir }));
        app.get('/video2.mp4', (req, res) => res.sendFile(path1.base, { root: path1.dir }));

        if (argv.srt) {
            const srtPath = path.parse(path.resolve(process.cwd(), argv.srt));
            app.get('/subtitles.srt', (req, res) => res.sendFile(srtPath.base, {root: srtPath.dir}));
        }

        app.listen(argv.port, () => {
            console.log(`Listening on port ${argv.port}!`);
            open(`http://0.0.0.0:${argv.port}`);
        });
    })
    .command(["generate <video1> <video2> [srt]"], "Generate static file", (yargs) => {
        yargs.option("filename", {
            default: "index.html",
            type: "string"
        }).option("outdir", {
            default: "./",
            type: "string"
        })
    }, (argv) => {
        const outdir = path.resolve(process.cwd(), argv.outdir);
        let html = fs.readFileSync(path.resolve(__dirname, "./dist/index.html")).toString();
        html = html.replace(`url1:"video1.mp4"`, `url1:"${argv.video1}"`)
            .replace(`url2:"video2.mp4"`, `url2:"${argv.video2}"`)
            .replace(`startFrame:0`, `startFrame:${argv.startFrame}`)
            .replace(`endFrame:-1`, `endFrame:${argv.endFrame}`);
        if (argv.srt) {
            html = html.replace(`subtitles:"./subtitles.srt"`, `subtitles:"${argv.srt}"`)
        }
        fs.writeFileSync(path.resolve(outdir, argv.filename), html);
    })
    .demandCommand()
    .help()
    .argv;
