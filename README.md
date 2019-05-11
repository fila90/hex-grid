# hex-grid

apple watch-like grid, built with vanilla JS and HTML

### how to

``` JS
// pass an array of data
const newGrid = hexGrid(Array(10)
  .fill(0)
  .map((_, i) => i));
// initialise the grid
newGrid.initGrid();
// optionally initialise event listeners
// grid will move on mousemove
newGrid.initEvents();
```
