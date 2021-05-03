"use strict";

const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass");
const browserSync = require("browser-sync");
const clean = require("gulp-clean");
const imagemin = require("gulp-imagemin");
const cleancss = require("gulp-clean-css");
const htmlmin = require("gulp-htmlmin");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const plumber = require("gulp-plumber");
const inject = require("gulp-inject");

sass.compiler = require("node-sass");

// distribution folder file names
var cssFile = "stlye.css";
var jsFile = "scripts.js";

// sass compiler
function style() {
  return src("./css/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(dest("./css"));
}

// watch changes in file and auto compile
function sassWatch() {
  watch("./css/*.scss", style);
}

// browsersync
function sync() {
  var files = [
    "./*html",
    "./css/*.css",
    "./js/*.js",
    "./images/*.{png,jpg,gif}",
  ];
  browserSync.init(files, {
    server: {
      baseDir: "./",
    },
  });
}

// del/clean distribution folder
function del() {
  return src("./dist/*", { read: false }).pipe(clean());
}

function html() {
  var target = src("./*.html");
  var sources = src(["./dist/js/*.js", "./dist/css/*.css"], { read: false });
  var transform = function (filepath) {
    if (filepath.slice(-3) === ".js") {
      return '<script src="' + filepath + '" defer></script>';
    }
    return inject.transform.apply(inject.transform, arguments);
  };
  return target
    .pipe(plumber())
    .pipe(inject(sources, { transform: transform }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest("./dist"));
}

function css() {
  return src([
    "./node_modules/bootstrap/dist/css/bootstrap.min.css",
    "./node_modules/font-awesome/css/font-awesome.min.css",
    "./node_modules/bootstrap-social/bootstrap-social.css",
    "./css/*.css",
  ])
    .pipe(plumber())
    .pipe(concat(cssFile))
    .pipe(cleancss())
    .pipe(dest("./dist/css"));
}

function js() {
  return src([
    "./node_modules/jquery/dist/jquery.slim.min.js",
    "./node_modules/popper.js/dist/umd/popper.min.js",
    "./node_modules/bootstrap/dist/js/bootstrap.min.js",
    "./js/*.js",
  ])
    .pipe(plumber())
    .pipe(concat(jsFile))
    .pipe(uglify())
    .pipe(dest("./dist/js"));
}

// imagemin

function imgMin() {
  return src("./images**/*")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 3 }),
      ])
    )
    .pipe(dest("./dist"));
}

// copy fonts
function copyFonts() {
  return src("./node_modules/font-awesome/fonts/**/*").pipe(
    dest("./dist/fonts")
  );
}

exports.style = style;
exports.sassWatch = sassWatch;
exports.sync = sync;
exports.start = parallel(sync, sassWatch);
exports.build = series(del, parallel(css, js, copyFonts, imgMin), html);
