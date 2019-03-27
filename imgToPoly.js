
//-----------------------------------------------------
// A little script to convert an image to a polygon or convex hull.
// Note that imagemagick must be installed and available on the path.
// This assumes the color at the top left pixel is the background color.
//-----------------------------------------------------

const shell = require('shelljs')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')

var args = process.argv.slice(2)

if(
    args.length !== 2 ||
    (args.length === 2 && !(args[1] === 'normal' || args[1] === 'convexHull'))
) {
    console.log('usage: node imgToPoly.js [file] [polygonType]')
    console.log('   polygonType: normal, convexHull')
    process.exit(0)
}
main(args[0], args[1])

//----------------------------------------------------------------------------------------------------------
//functions

function main(imgPath, polygonType) {
    convertImageToMonochrome(imgPath, polygonType)
    let pixels = createPixelMatrix()
    drawPixels(pixels)
    let polygon = createPolygon(pixels)
    polygon = orderPolygon(polygon)
    polygon = orderPolygon(polygon) // there's a bug in the order function that needs to be fixed, ordering twice for now
    outputPolygon(polygon)
}

function convertImageToMonochrome(imgPath, polygonType) {
    shell.exec(`convert ${imgPath} -set colorspace monochrome -separate -average out.png`)
    shell.exec('convert out.png out.txt')
}

function createPixelMatrix() {
    //read in file
    let lines = fs.readFileSync('out.txt').toString().split("\n")
    //get dimensions
    let width = lines[0].split(': ')[1].split(',')[0]
    let height = lines[0].split(': ')[1].split(',')[1]
    //remove comments
    lines = lines.filter((line) => !line.startsWith('#')).filter((line) => line.trim().length !== 0)
    //build pixels matrix (row, column)
    let pixels = [height]
    for(let i = 0; i < height; i++) {
        pixels[i] = [width]
    }
    lines.forEach((line) => {
        //get row and column
        let rowColumn = line.split(':')[0]
        let column = parseInt(rowColumn.split(',')[0])
        let row = parseInt(rowColumn.split(',')[1])
        let color = line.split('#')[1].split(' ')[0]

        pixels[row][column] = color
    })
    return pixels
}

function drawPixels(pixels) {
    let bgColor = pixels[0][0]
    console.log(`image dimensions: ${pixels[0].length}, ${pixels.length}`)    
    pixels.forEach((row) => {
        let rowOut = '|'
        row.forEach((column) => {
            rowOut += column == bgColor ? ' ' : 'X'
        })
        rowOut += '|'
        console.log(rowOut)
    })
}

function createPolygon(pixels) {
    let bgColor = pixels[0][0]
    let polygon = []
    let width = pixels[0].length
    let height = pixels.length

    for(let row = 0; row < height; row++) {
        for(let column = 0; column < width; column++) {
            if(pixels[row][column] != bgColor) {
                //if the point is at one of the image edges then it gets added
                //if the point has an adjacent pixel that is the bgColor then add it
                if(
                    (row == 0 || row == height-1 || column == 0 || column == width-1) ||
                    (hasBgColorNeighbor(row, column)) 
                ) {
                    polygon.push({x: column, y: row})
                }
            }
        }
    }
    return polygon

    function hasBgColorNeighbor(row, column) {
        if(pixels[row-1][column-1] == bgColor) return true
        if(pixels[row-1][column] == bgColor) return true
        if(pixels[row-1][column+1] == bgColor) return true
        if(pixels[row][column-1] == bgColor) return true
        if(pixels[row][column+1] == bgColor) return true
        if(pixels[row+1][column-1] == bgColor) return true
        if(pixels[row+1][column] == bgColor) return true
        if(pixels[row+1][column+1] == bgColor) return true
        return false
    }
}

function orderPolygon(polygon) {
    if(polygon.length == 0) return
    let pointList = _.cloneDeep(polygon)
    let ordered = []

    //start with a single point
    ordered.push(pointList.splice(0, 1)[0])
    
    while(pointList.length > 1) {
        let currPoint = ordered[ordered.length-1]
        let nextClosestI = 0
        for(let plI = 0; plI < pointList.length; plI++) {
            if(distance(currPoint, pointList[nextClosestI]) >= distance(currPoint, pointList[plI])) {
                nextClosestI = plI
            }
        }
        ordered.push(pointList.splice(nextClosestI, 1)[0])
    }
    ordered.push(pointList.splice(0, 1)[0])
    return ordered

    function distance(a, b) {
        return Math.sqrt((b.x-a.x)*(b.x-a.x) + (b.y-a.y)*(b.y-a.y))
    }
}

function outputPolygon(polygon) {
    console.log('')
    console.log('Polygon JSON')
    console.log('')
    if(polygon.length == 0) {
        console.log('[]')
        return
    }
    console.log('[')
    console.log(`{"x":${polygon[0].x}, "y":${polygon[0].y}}`)
    polygon
    .filter((e, i) => i > 0)
    .forEach((point) => {
        console.log(`,{"x":${point.x}, "y":${point.y}}`)
    })
    console.log(']')
}

