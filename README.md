This is a little node project that will draw a bounding polygon around an image.  I was having a discussion with a buddy and I couldn't find a tool that does this.

Imagemagick (https://www.imagemagick.org/) must be installed and on the path.

To use this:

* clone the project
* npm install
* node imgToPoly.js <imageFile> [normal|convexHull]

You can test the polygon out using the testPolygon.html page

**Note** convex hull has not yet been implemented.